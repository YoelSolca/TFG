import { FORMATO_API, PERIODOS_RAPIDOS, rangoDesdeHoy } from "../utils/Periodo";
import { mensajeDelServidor } from "../utils/Errores";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { crearInforme } from "../actions/Informe.action";

// ───────────── Parte A: estado y lógica de generar ─────────────

// Mismo tope que valida el servidor: un período más largo manda demasiados datos al servicio externo.
const MAX_DIAS = 366;

// Devuelve el mensaje de error, o "" si el período está bien. Lo mismo se valida en el servidor.
function validarPeriodo(desde: Dayjs | null, hasta: Dayjs | null): string {
  if (!desde?.isValid() || !hasta?.isValid()) return "Elegí las dos fechas.";
  if (desde.isAfter(hasta, "day")) return "La fecha de inicio no puede ser posterior a la de fin.";
  if (hasta.diff(desde, "day") > MAX_DIAS) return "El período no puede superar un año.";
  return "";
}

// "personalizado" muestra los selectores de fecha; los demás llenan las fechas solos.
const PERIODOS = [...PERIODOS_RAPIDOS, { valor: "personalizado", etiqueta: "Personalizado", meses: 0 }];
const PERIODO_INICIAL = "3m";

export default function GenerarInformeDialog({
  open,
  pacienteId,
  nombrePaciente,
  origen = "paciente",
  onClose,
}: {
  open: boolean;
  pacienteId: string;
  nombrePaciente: string;
  // Desde dónde se abrió: el detalle del informe usa esto para saber adónde vuelve el botón "Volver".
  origen?: "paciente" | "informes";
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(PERIODO_INICIAL);
  const [desde, setDesde] = useState<Dayjs | null>(null);
  const [hasta, setHasta] = useState<Dayjs | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  // Cada vez que se abre, arranca limpio y con los últimos 3 meses elegidos.
  useEffect(() => {
    if (!open) return;
    const inicial = rangoDesdeHoy(PERIODOS.find((p) => p.valor === PERIODO_INICIAL)!.meses);
    setPeriodo(PERIODO_INICIAL);
    setDesde(inicial.desde);
    setHasta(inicial.hasta);
    setError("");
  }, [open]);

  // Un período rápido llena las fechas solo; "personalizado" deja las que había para ajustarlas.
  const elegirPeriodo = (valor: string) => {
    setPeriodo(valor);
    setError("");
    const elegido = PERIODOS.find((p) => p.valor === valor)!;
    if (elegido.meses > 0) {
      const rango = rangoDesdeHoy(elegido.meses);
      setDesde(rango.desde);
      setHasta(rango.hasta);
    }
  };

  // Mientras se genera no se puede cerrar: la llamada sigue en el servidor (y se cobra) aunque se cierre la ventana.
  const cerrar = () => {
    if (!generando) onClose();
  };

  const generar = async () => {
    const problema = validarPeriodo(desde, hasta);
    if (problema) {
      setError(problema);
      return;
    }

    setGenerando(true);
    setError("");
    try {
      const informe = await crearInforme(pacienteId, desde!.format(FORMATO_API), hasta!.format(FORMATO_API));
      onClose();
      navigate(`/pacientes/${pacienteId}/informes/${informe.id}`, { state: { from: origen } });
    } catch (e) {
      setError(mensajeDelServidor(e, "No pudimos generar el informe. Intentá de nuevo.")); // 400: sin sesiones, período inválido, falta configurar la clave...
    } finally {
      setGenerando(false);
    }
  };

  // ───────────── Parte A: pantalla (el contenido y los botones se agregan en las partes B y C) ─────────────

  return (
    <Dialog open={open} onClose={cerrar} fullWidth maxWidth="xs">
      <DialogTitle className="flex items-center gap-2">
        <AutoAwesomeIcon color="primary" />
        Generar informe con IA
      </DialogTitle>
      {/* Parte B: fechas, aviso y estado "Generando..." */}
      <DialogContent>
        {generando ? (
          // La espera puede ser larga: se reemplazan los campos por un aviso claro de que está trabajando.
          // Barra indeterminada: no sabemos cuánto falta, así que no se muestra un avance inventado.
          <Stack spacing={2} className="py-6 text-center">
            <LinearProgress />
            <Typography>Generando el informe de {nombrePaciente}...</Typography>
            <Typography variant="body2" color="text.secondary">
              Puede demorar hasta un minuto. No cierres esta ventana.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2.5} className="pt-1">
            <Typography variant="body2" color="text.secondary">
              Se analizarán las sesiones de {nombrePaciente} del período elegido.
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary" className="font-medium mb-2">
                Período
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                color="primary"
                value={periodo}
                onChange={(_, valor) => valor && elegirPeriodo(valor)}
                className="flex-wrap"
              >
                {PERIODOS.map((p) => (
                  <ToggleButton key={p.valor} value={p.valor}>
                    {p.etiqueta}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            {periodo === "personalizado" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DatePicker
                  label="Desde"
                  value={desde}
                  onChange={(fecha) => {
                    setDesde(fecha);
                    setError("");
                  }}
                  maxDate={hasta ?? dayjs()}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="Hasta"
                  value={hasta}
                  onChange={(fecha) => {
                    setHasta(fecha);
                    setError("");
                  }}
                  minDate={desde ?? undefined}
                  maxDate={dayjs()}
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Stack>
            )}
            <Alert severity="info">
              El informe lo redacta una inteligencia artificial a partir de los resultados y las observaciones de las
              sesiones del período.
            </Alert>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      {/* Parte C: botones Cancelar / Generar */}
      <DialogActions className="px-6 pb-4">
        <Button onClick={cerrar} disabled={generando}>
          Cancelar
        </Button>
        {/* Deshabilitado mientras genera: cada llamada cuesta plata, no se puede mandar dos veces. */}
        <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={generar} disabled={generando}>
          {generando ? "Generando..." : "Generar informe"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
