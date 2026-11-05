import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { obtenerSeguimientoPaciente } from "../../actions/pacientes.action";
import { PacienteDetalle } from "../../Model/PacienteDetalle.model";
import { SesionSeguimiento } from "../../Model/paciente.model";
import { SectionHeader } from "../../components/common";
import {
  AreaProgreso,
  Semana,
  calcularConstancia,
  progresoPorArea,
  resumirSesiones,
} from "../../utils/seguimiento";

// ───────────── Parte A: períodos y fechas ─────────────

const PERIODOS = [
  { valor: "1m", etiqueta: "Último mes", meses: 1 },
  { valor: "3m", etiqueta: "Últimos 3 meses", meses: 3 },
  { valor: "6m", etiqueta: "Últimos 6 meses", meses: 6 },
  { valor: "12m", etiqueta: "Último año", meses: 12 },
];

const FORMATO_API = "YYYY-MM-DD";

interface Rango {
  desde: string;
  hasta: string;
}

// Los períodos se miden desde hoy hacia atrás.
function rangoDe(valor: string): Rango {
  const meses = PERIODOS.find((p) => p.valor === valor)!.meses;
  const hoy = dayjs();
  return { desde: hoy.subtract(meses, "month").format(FORMATO_API), hasta: hoy.format(FORMATO_API) };
}

// ───────────── Parte B: piezas de "Progreso por área" y "Constancia" ─────────────

const AZUL = "#2563EB";
const AZUL_OSCURO = "#1E3A8A";
const ANTES = "#A5AFC0";
const VACIO = "#E9EDF4";

// Cuadradito de color con su texto, para las referencias de cada bloque.
function Referencia({ color, texto }: { color: string; texto: string }) {
  return (
    <span>
      <Box component="span" sx={{ display: "inline-block", width: 10, height: 10, borderRadius: "2px", bgcolor: color, mr: 0.75 }} />
      {texto}
    </span>
  );
}

// "▲ +12 pts" en verde, "▼ -3 pts" en ámbar, o "Pocos datos" si no alcanza para comparar.
function CambioChip({ item }: { item: AreaProgreso }) {
  if (item.pocosDatos) return <Chip size="small" label="Pocos datos" sx={{ bgcolor: VACIO, fontWeight: 600 }} />;

  const sube = item.diferencia >= 0;
  return (
    <Chip
      size="small"
      label={sube ? `▲ +${item.diferencia} pts` : `▼ ${item.diferencia} pts`}
      sx={{ bgcolor: sube ? "#E8F5E9" : "#FFF1DA", color: sube ? "#1E4620" : "#8A5300", fontWeight: 600 }}
    />
  );
}

// Una fila por área: "antes → ahora" con dos barras, o una sola barra si hay pocos datos.
function AreaFila({ item }: { item: AreaProgreso }) {
  return (
    <Box>
      <Stack direction="row" className="justify-between items-center mb-1" useFlexGap sx={{ gap: 1 }}>
        <Typography variant="body2" className="font-medium">{item.area}</Typography>
        <Stack direction="row" className="items-center" useFlexGap sx={{ gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {item.pocosDatos ? <b>{item.ultimo}%</b> : <>{item.antes}% → <b>{item.ahora}%</b></>}
          </Typography>
          <CambioChip item={item} />
        </Stack>
      </Stack>

      {item.pocosDatos ? (
        <>
          <LinearProgress variant="determinate" value={item.ultimo} className="h-2 rounded-[32px]" />
          <Typography variant="caption" color="text.secondary">
            Se trabaja desde el {item.desde.format("D/M")} ({item.cantidad} {item.cantidad === 1 ? "sesión" : "sesiones"}). Todavía no hay comparación.
          </Typography>
        </>
      ) : (
        <Stack spacing={0.5}>
          <LinearProgress
            variant="determinate"
            value={item.antes}
            className="h-2 rounded-[32px]"
            sx={{ bgcolor: VACIO, "& .MuiLinearProgress-bar": { bgcolor: ANTES } }}
          />
          <LinearProgress variant="determinate" value={item.ahora} className="h-2 rounded-[32px]" />
        </Stack>
      )}
    </Box>
  );
}

// Número grande con su rótulo, para el resumen de la constancia.
function Dato({ valor, rotulo, pista }: { valor: string | number; rotulo: string; pista?: string }) {
  return (
    <Box className="rounded-[10px] border border-[#E3E8F0] p-3">
      <Typography className="text-[26px] font-semibold leading-8">{valor}</Typography>
      <Typography variant="body2">{rotulo}</Typography>
      <Typography variant="caption" color="text.secondary">{pista ?? " "}</Typography>
    </Box>
  );
}

// Una columna por semana, con el mes escrito sobre la primera semana de cada mes.
function TiraSemanas({ semanas }: { semanas: Semana[] }) {
  const color = (n: number) => (n === 0 ? VACIO : n === 1 ? AZUL : AZUL_OSCURO);

  return (
    // Una sola fila: los cuadrados se achican si hay muchas semanas (máximo 26 px).
    <Box className="flex gap-[4px]">
      {semanas.map((s, i) => (
        <Box key={s.inicio.valueOf()} className="flex flex-col gap-1" sx={{ flex: "1 1 0", minWidth: 0, maxWidth: 26 }}>
          <Typography variant="caption" color="text.secondary" className="h-4 leading-4 whitespace-nowrap overflow-visible">
            {i === 0 || semanas[i - 1].numeroMes !== s.numeroMes ? s.mes : ""}
          </Typography>
          <Tooltip
            arrow
            title={`Semana del ${s.inicio.format("D/M")}: ${s.cantidad === 0 ? "sin sesión" : `${s.cantidad} ${s.cantidad === 1 ? "sesión" : "sesiones"}`}`}
          >
            <Box sx={{ width: "100%", aspectRatio: "1 / 1", borderRadius: "4px", bgcolor: color(s.cantidad) }} />
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}

export default function Seguimiento() {
  const { id } = useParams();
  const { paciente } = useOutletContext<{ paciente: PacienteDetalle }>();

  // ───────────── Parte A: estado de la pantalla ─────────────

  const [periodo, setPeriodo] = useState("6m");
  const [rango, setRango] = useState<Rango>(() => rangoDe("6m"));
  const [datos, setDatos] = useState<SesionSeguimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0); // sube cuando se aprieta "Reintentar" para volver a pedir

  // Cada vez que cambia el paciente, el rango o el intento se vuelven a pedir las sesiones.
  useEffect(() => {
    let vigente = true; // si el rango cambia antes de que llegue la respuesta, se descarta la vieja
    setCargando(true);
    setError(false);

    obtenerSeguimientoPaciente(id!, rango.desde, rango.hasta)
      .then((respuesta) => {
        if (vigente) setDatos(respuesta);
      })
      .catch(() => vigente && setError(true))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id, rango, intento]);

  // Los datos del backend se pasan a porcentajes, áreas, etc. (ver utils/seguimiento.ts).
  const sesiones = useMemo(() => resumirSesiones(datos), [datos]);

  // Parte B: lo que muestran "Progreso por área" y "Constancia".
  const areas = useMemo(() => progresoPorArea(sesiones), [sesiones]);
  const constancia = useMemo(() => calcularConstancia(sesiones), [sesiones]);

  const cambiarPeriodo = (valor: string) => {
    setPeriodo(valor);
    if (valor !== "custom") setRango(rangoDe(valor));
  };

  // Tocar una fecha a mano pasa el selector a "Personalizado".
  const cambiarFecha = (campo: keyof Rango, fecha: Dayjs | null) => {
    if (!fecha?.isValid()) return;
    setRango((r) => ({ ...r, [campo]: fecha.format(FORMATO_API) }));
    setPeriodo("custom");
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
          {PERIODOS.map((p) => (
            <MenuItem key={p.valor} value={p.valor}>
              {p.etiqueta}
            </MenuItem>
          ))}
          <MenuItem value="custom">Personalizado</MenuItem>
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
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => setIntento((n) => n + 1)}>Reintentar</Button>}>
          No pudimos cargar el seguimiento.
        </Alert>
      )}

      {/* Parte B */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader
              title="Progreso por área"
              subtitle="Promedio de aciertos de las primeras 2 sesiones frente a las últimas 2. Cada área se compara solo consigo misma."
            />
            {areas.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay sesiones en este período.</Typography>
            ) : (
              <>
                <Stack direction="row" spacing={2} className="text-[12px]" sx={{ color: "text.secondary" }}>
                  <Referencia color={ANTES} texto="Al empezar" />
                  <Referencia color={AZUL} texto="Ahora" />
                </Stack>
                {areas.map((a) => <AreaFila key={a.area} item={a} />)}
              </>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader
              title="Constancia"
              subtitle="Cada cuadrado es una semana, desde la primera sesión del período. Pasá el mouse para ver el detalle."
            />
            {constancia.total === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay sesiones en este período.</Typography>
            ) : (
              <>
                <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Dato valor={constancia.total} rotulo={constancia.total === 1 ? "sesión" : "sesiones"} pista="en el período" />
                  <Dato
                    valor={constancia.porSemana.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
                    rotulo="por semana"
                    pista="promedio"
                  />
                  <Dato
                    valor={constancia.mayorPausa ? `${constancia.mayorPausa.dias} días` : "—"}
                    rotulo="mayor pausa"
                    pista={constancia.mayorPausa ? `del ${constancia.mayorPausa.desde.format("D/M")} al ${constancia.mayorPausa.hasta.format("D/M")}` : undefined}
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
                  {constancia.semanas.filter((s) => s.cantidad > 0).length} de {constancia.semanas.length} semanas con al menos una sesión.
                </Typography>
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info">
        El seguimiento se basa en resultados cuantitativos y observaciones registradas durante las sesiones. Son
        indicadores de seguimiento de la actividad digital, no un diagnóstico. Mejorar en un juego puede deberse en parte
        a la práctica.
      </Alert>
    </>
  );
}
