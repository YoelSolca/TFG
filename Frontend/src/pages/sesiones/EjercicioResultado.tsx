import { mensajeDelServidor } from "../../utils/Errores";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Breadcrumbs, Button, Card, Grid, Stack, TextField, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SaveIcon from "@mui/icons-material/Save";
import axios from "axios";
import dayjs from "dayjs";
import { BackButton } from "../../components/Common";
import {
  finalizarSesion,
  guardarResultado,
  obtenerMetricas,
  obtenerResultadoEjercicio,
} from "../../actions/Sesion.action";
import { ResultadoDetalle } from "../../models/Sesion.model";
import { formatearTiempo } from "../../utils/Tiempo";
import { ResultadoJuego } from "../ejercicios/Tipos";

const ETIQUETAS_METRICAS: Record<string, string> = {
  movimientos: "Movimientos",
  omisiones: "Omisiones",
  pistas: "Pistas usadas",
};

const etiquetaMetrica = (nombre: string) =>
  ETIQUETAS_METRICAS[nombre] ?? nombre.charAt(0).toUpperCase() + nombre.slice(1);

// Mismo tope que valida el servidor para las observaciones de un ejercicio.
const MAX_OBSERVACIONES = 500;

// Saca un texto legible de lo que falló: el detalle del servidor, el mensaje propio (falta una métrica) o uno genérico.
function mensajeDeError(error: unknown): string {
  if (!axios.isAxiosError(error) && error instanceof Error) return error.message;
  return mensajeDelServidor(error, "No se pudo guardar el resultado.");
}

export default function EjercicioResultado() {
  const { id, ejercicioId } = useParams();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<ResultadoDetalle | null>(null);
  const [error, setError] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState("");
  const location = useLocation();
  const fromEjercicios = location.state?.from === "ejercicios";
  const backTo = fromEjercicios ? "/ejercicios" : `/sesiones/${id}`;
  const backLabel = fromEjercicios ? "Volver a ejercicios" : "Volver a la sesión";

  useEffect(() => {
    obtenerResultadoEjercicio(id!, ejercicioId!)
      .then(setResultado)
      .catch(() => setError(true));
  }, [id, ejercicioId]);

  const registrado = resultado?.registrado ?? false;
  // Resultado que el juego acaba de producir y que (por ahora) no se guardó en la base.
  const delJuego: ResultadoJuego | undefined = location.state?.resultadoJuego;
  const sinGuardar = !registrado && delJuego !== undefined;
  const hayDatos = registrado || sinGuardar;

  const aciertos = registrado ? resultado?.aciertos : delJuego?.aciertos;
  const errores = registrado ? resultado?.errores : delJuego?.errores;
  const tiempoSegundos = registrado ? resultado?.tiempoSegundos : delJuego?.tiempoSegundos;
  // Solo se muestran las métricas que el ejercicio evalúa (las que vienen en el resultado).
  const metricas = registrado ? (resultado?.metricas ?? []) : (delJuego?.metricas ?? []);

  // La cola de ejercicios de la sesión y en cuál va (viaja de pantalla en pantalla). Sin cola, este resultado
  // se abrió suelto (por ejemplo desde el historial) y no hay "siguiente".
  const queue: number[] | undefined = location.state?.queue;
  const index: number = location.state?.index ?? 0;
  const enCola = Array.isArray(queue);
  const esUltimo = !enCola || index >= queue.length - 1;

  // Guarda el resultado del juego junto con la observación, y sigue: al próximo ejercicio, o si era el último
  // finaliza la sesión y vuelve a la ficha del paciente.
  const guardarYContinuar = async () => {
    if (!delJuego) return;
    setGuardando(true);
    setErrorGuardado("");
    try {
      // El juego manda las métricas por nombre ("movimientos", "pistas"); el servidor las pide por id del catálogo.
      const catalogo = await obtenerMetricas();
      const metricas = (delJuego.metricas ?? []).map((m) => {
        const delCatalogo = catalogo.find((c) => c.nombre === m.nombre);
        if (!delCatalogo) throw new Error(`Falta la métrica "${m.nombre}" en el catálogo.`);
        return { metricaId: delCatalogo.id, valor: m.valor };
      });

      await guardarResultado(id!, ejercicioId!, {
        aciertos: delJuego.aciertos,
        errores: delJuego.errores,
        tiempoSegundos: delJuego.tiempoSegundos,
        observaciones: observaciones.trim() || null,
        metricas,
      });

      if (!enCola) {
        navigate(backTo);
      } else if (!esUltimo) {
        navigate(`/sesiones/${id}/ejercicios/${queue[index + 1]}`, { state: { queue, index: index + 1 } });
      } else {
        const sesion = await finalizarSesion(Number(id));
        navigate(`/pacientes/${sesion.pacienteId}/informacion`);
      }
    } catch (e) {
      setErrorGuardado(mensajeDeError(e));
      setGuardando(false);
    }
  };

  const stats = [
    { label: "Aciertos", icon: CheckCircleIcon, bg: "#E8F5E9", color: "#2E7D32", value: aciertos },
    { label: "Error", icon: CancelIcon, bg: "#FDECEA", color: "#C62828", value: errores },
    {
      label: "Tiempo",
      icon: AccessTimeIcon,
      bg: "#E3F2FD",
      color: "#1565C0",
      value: tiempoSegundos == null ? undefined : formatearTiempo(tiempoSegundos),
    },
    ...metricas.map((m) => ({
      label: etiquetaMetrica(m.nombre),
      icon: ShowChartIcon,
      bg: "#F3E8FD",
      color: "#6A1B9A",
      value: m.valor,
    })),
  ];

  return (
    <>
      {/* Dentro de la sesión no se vuelve atrás: se avanza con "Guardar y continuar". */}
      {!enCola && <BackButton to={backTo}>{backLabel}</BackButton>}

      {error && <Alert severity="error">No encontramos este ejercicio en la sesión.</Alert>}

      {resultado && (
        <>
          <Box>
            <Breadcrumbs separator="•" className="text-[14px] mb-2" sx={{ color: "text.secondary" }}>
              <Typography variant="body2" color="text.secondary">
                Ejercicio
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resultado.tipoEjercicio}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {resultado.ejercicio}
              </Typography>
            </Breadcrumbs>
            <Typography variant="h4" className="font-bold">
              Resultado del ejercicio
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              {dayjs(resultado.fecha).format("DD/MM/YYYY")} · {dayjs(resultado.fecha).format("HH:mm")} hs ·{" "}
              {resultado.nombre} {resultado.apellido}
            </Typography>
            {enCola && (
              <Typography variant="body2" color="primary.main" className="font-medium mt-1">
                Ejercicio {index + 1} de {queue.length}
              </Typography>
            )}
          </Box>

          {!hayDatos && <Alert severity="info">Este ejercicio todavía no tiene un resultado registrado.</Alert>}

          <Grid container spacing={3}>
            {stats.map(({ label, icon: Icon, bg, color, value }) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: stats.length >= 4 ? 3 : 4 }}>
                <Card className="p-5">
                  <Stack direction="row" className="justify-between items-start">
                    <Typography variant="body2" color="text.secondary">
                      {label}
                    </Typography>
                    <Box className="w-8 h-8 rounded-full grid place-items-center" sx={{ bgcolor: bg, color }}>
                      <Icon fontSize="small" />
                    </Box>
                  </Stack>
                  <Typography className="text-[32px] font-bold mt-2">
                    {hayDatos && value != null ? value : "-"}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card className="p-6">
            <Typography variant="subtitle1" className="mb-3">
              Observaciones:
            </Typography>
            {/* Si el resultado todavía no se guardó, la observación se escribe acá; si ya está guardado, solo se lee. */}
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={sinGuardar ? observaciones : (resultado.observaciones ?? "")}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={
                sinGuardar ? "Escribí una observación sobre cómo resolvió el ejercicio (opcional)" : "Sin observaciones"
              }
              helperText={sinGuardar ? `${observaciones.length}/${MAX_OBSERVACIONES}` : undefined}
              slotProps={{
                input: { readOnly: !sinGuardar },
                htmlInput: { maxLength: MAX_OBSERVACIONES },
                formHelperText: { className: "text-right" },
              }}
            />
          </Card>

          {sinGuardar && (
            <>
              {errorGuardado && <Alert severity="error">{errorGuardado}</Alert>}
              <Stack direction="row" className="justify-end">
                <Button variant="contained" startIcon={<SaveIcon />} disabled={guardando} onClick={guardarYContinuar}>
                  {guardando ? "Guardando..." : esUltimo ? "Guardar registro" : "Guardar y continuar"}
                </Button>
              </Stack>
            </>
          )}
        </>
      )}
    </>
  );
}
