import { FORMATO_API, PERIODOS_RAPIDOS, rangoDesdeHoy } from "../../utils/Periodo";
import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Alert, Box, Button, Card, CircularProgress, Grid, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { obtenerEvolucionPaciente } from "../../actions/Pacientes.action";
import { PacienteDetalle } from "../../models/PacienteDetalle.model";
import { SesionEvolucion } from "../../models/Evolucion.model";
import { SectionHeader } from "../../components/Common";
import { AZUL, AZUL_OSCURO, Dato, Referencia, TiraSemanas, VACIO } from "../../components/PiezasEvolucion";
import AciertosPorSesion from "../../components/AciertosPorSesion";
import DondeMasCuesta from "../../components/DondeMasCuesta";
import EjerciciosPorArea from "../../components/EjerciciosPorArea";
import { calcularConstancia, dondeMasCuesta, ejerciciosPorArea, resumirSesiones } from "../../utils/Evolucion";

// ───────────── Parte A: períodos y fechas ─────────────

interface Rango {
  desde: string;
  hasta: string;
}

const PERIODO_PERSONALIZADO = "personalizado";

// Los períodos se miden desde hoy hacia atrás.
function rangoDe(valor: string): Rango {
  const { desde, hasta } = rangoDesdeHoy(PERIODOS_RAPIDOS.find((p) => p.valor === valor)!.meses);
  return { desde: desde.format(FORMATO_API), hasta: hasta.format(FORMATO_API) };
}

export default function Evolucion() {
  const { id } = useParams();
  const { paciente } = useOutletContext<{ paciente: PacienteDetalle }>();

  // ───────────── Parte A: estado de la pantalla ─────────────

  const [periodo, setPeriodo] = useState("6m");
  const [rango, setRango] = useState<Rango>(() => rangoDe("6m"));
  const [datos, setDatos] = useState<SesionEvolucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0); // sube cuando se aprieta "Reintentar" para volver a pedir

  // Cada vez que cambia el paciente, el rango o el intento se vuelven a pedir las sesiones.
  useEffect(() => {
    let vigente = true; // si el rango cambia antes de que llegue la respuesta, se descarta la vieja
    setCargando(true);
    setError(false);

    obtenerEvolucionPaciente(id!, rango.desde, rango.hasta)
      .then((respuesta) => {
        if (vigente) setDatos(respuesta);
      })
      .catch(() => vigente && setError(true))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id, rango, intento]);

  // Los datos del backend se pasan a porcentajes, áreas, etc. (ver utils/Evolucion.ts).
  const sesiones = useMemo(() => resumirSesiones(datos), [datos]);

  // Parte B: lo que muestran "Constancia" y "Ejercicios realizados por área".
  const constancia = useMemo(() => calcularConstancia(sesiones), [sesiones]);
  const porArea = useMemo(() => ejerciciosPorArea(sesiones), [sesiones]);
  const cuesta = useMemo(() => dondeMasCuesta(sesiones), [sesiones]);

  // Elegir un período rápido recalcula las fechas (desde hoy hacia atrás); "Personalizado" deja las que están.
  const cambiarPeriodo = (valor: string) => {
    setPeriodo(valor);
    if (valor !== PERIODO_PERSONALIZADO) setRango(rangoDe(valor));
  };

  // Tocar una fecha a mano pasa el selector a "Personalizado".
  const cambiarFecha = (campo: keyof Rango, fecha: Dayjs | null) => {
    if (!fecha?.isValid()) return;
    setRango((r) => ({ ...r, [campo]: fecha.format(FORMATO_API) }));
    setPeriodo(PERIODO_PERSONALIZADO);
  };

  // ───────────── Parte A: pantalla ─────────────

  return (
    <>
      <Stack direction="row" useFlexGap className="gap-4 flex-wrap items-center justify-between">
        <Stack direction="row" useFlexGap className="gap-3 flex-wrap">
          <DatePicker
            label="Desde"
            value={dayjs(rango.desde)}
            maxDate={dayjs(rango.hasta)}
            format="DD/MM/YYYY"
            onChange={(f) => cambiarFecha("desde", f)}
            sx={{ width: { xs: "100%", sm: 170 }, bgcolor: "background.paper" }}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="Hasta"
            value={dayjs(rango.hasta)}
            minDate={dayjs(rango.desde)}
            format="DD/MM/YYYY"
            onChange={(f) => cambiarFecha("hasta", f)}
            sx={{ width: { xs: "100%", sm: 170 }, bgcolor: "background.paper" }}
            slotProps={{ textField: { size: "small" } }}
          />
        </Stack>

        <TextField
          select
          size="small"
          value={periodo}
          onChange={(e) => cambiarPeriodo(e.target.value)}
          className="w-full sm:w-[220px]"
          sx={{ bgcolor: "background.paper" }}
        >
          {PERIODOS_RAPIDOS.map((p) => (
            <MenuItem key={p.valor} value={p.valor}>
              {p.etiqueta}
            </MenuItem>
          ))}
          <MenuItem value={PERIODO_PERSONALIZADO}>Personalizado</MenuItem>
        </TextField>
      </Stack>

      <Card className="p-6">
        <Typography variant="overline" color="text.secondary">
          Objetivo del tratamiento
        </Typography>
        <Typography>{paciente.objetivo || "Todavía no se cargó un objetivo para este paciente."}</Typography>
        <Typography variant="body2" color="text.secondary" className="mt-1">
          {cargando
            ? "Cargando sesiones..."
            : sesiones.length === 0
              ? "No hay sesiones registradas en el período elegido."
              : `${sesiones.length} ${sesiones.length === 1 ? "sesión registrada" : "sesiones registradas"} en el período, desde el ${sesiones[0].fecha.format("D/M")}.`}
        </Typography>
      </Card>

      {cargando && (
        <Stack className="items-center py-6">
          <CircularProgress size={28} />
        </Stack>
      )}

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setIntento((n) => n + 1)}>
              Reintentar
            </Button>
          }
        >
          No pudimos cargar la evolución.
        </Alert>
      )}

      {/* Parte B */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader
              title="Continuidad del tratamiento"
              subtitle="Cada cuadrado representa una semana del período. El color indica la cantidad de sesiones realizadas. Pasá el mouse para ver el detalle."
            />
            {constancia.total === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay sesiones en este período.
              </Typography>
            ) : (
              <>
                <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Dato
                    valor={constancia.total}
                    rotulo={constancia.total === 1 ? "sesión" : "sesiones"}
                    pista="en el período"
                  />
                  <Dato
                    valor={constancia.porSemana.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
                    rotulo="por semana"
                    pista="promedio"
                  />
                  <Dato
                    valor={constancia.mayorPausa ? `${constancia.mayorPausa.dias} días` : "—"}
                    rotulo="mayor pausa"
                    pista={
                      constancia.mayorPausa
                        ? `del ${constancia.mayorPausa.desde.format("D/M")} al ${constancia.mayorPausa.hasta.format("D/M")}`
                        : undefined
                    }
                  />
                </Box>
                <Box className="flex-1 flex flex-col justify-center gap-3 py-2">
                  <TiraSemanas semanas={constancia.semanas} />
                  <Stack direction="row" spacing={2} className="text-[12px]" sx={{ color: "text.secondary" }}>
                    <Referencia color={VACIO} texto="Sin sesión" />
                    <Referencia color={AZUL} texto="1 sesión" />
                    <Referencia color={AZUL_OSCURO} texto="2 o más" />
                  </Stack>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {constancia.semanas.filter((s) => s.cantidad > 0).length} de {constancia.semanas.length} semanas con
                  al menos una sesión.
                </Typography>
              </>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader
              title="Áreas trabajadas"
              subtitle="Distribución de los ejercicios realizados según el área trabajada durante el período. Las áreas con valor cero indican que aún no se registraron ejercicios."
            />
            {sesiones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay ejercicios en este período.
              </Typography>
            ) : (
              <EjerciciosPorArea areas={porArea} />
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader
              title="Evolución del desempeño"
              subtitle="Porcentaje de aciertos en cada sesión, calculado a partir del promedio de sus ejercicios. Como los ejercicios pueden variar entre sesiones, la evolución es orientativa."
            />
            {sesiones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay sesiones en este período.
              </Typography>
            ) : (
              <AciertosPorSesion sesiones={sesiones} />
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader
              title="Ejercicios con mayor dificultad"
              subtitle="Ejercicios con menor porcentaje de aciertos durante el período. Permite identificar cuáles necesitan mayor atención. Se indica también cuántas veces se realizó cada ejercicio."
            />
            {sesiones.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay ejercicios en este período.
              </Typography>
            ) : (
              <DondeMasCuesta ejercicios={cuesta} />
            )}
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info">
            La evolución se basa en los resultados cuantitativos registrados durante las sesiones,
            que funcionan como indicadores del desempeño en los ejercicios realizados.
      </Alert>
    </>
  );
}
