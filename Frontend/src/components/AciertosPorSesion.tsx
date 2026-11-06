import { createContext, useContext, useMemo, useState } from "react";
import { Divider, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { ChartsTooltipContainer, useAxesTooltip } from "@mui/x-charts/ChartsTooltip";
import { LineChart } from "@mui/x-charts/LineChart";
import { aciertosPorSesion, areasConSesiones, PuntoAciertos, SesionResumen } from "../utils/Evolucion";
import { AZUL } from "./PiezasEvolucion";

const TODAS = "todas";
const EJERCICIOS_VISIBLES = 4;

// El tooltip lo dibuja la librería, así que los puntos le llegan por contexto.
const PuntosContext = createContext<PuntoAciertos[]>([]);

// Al pasar por un punto: la fecha, el resultado de la sesión y qué ejercicios lo forman (con su porcentaje cada uno).
function TooltipDeLaSesion() {
  const puntos = useContext(PuntosContext);
  const ejes = useAxesTooltip({ directions: ["x"] });
  const punto = ejes?.[0] ? puntos[ejes[0].dataIndex] : undefined;

  return (
    <ChartsTooltipContainer trigger="axis">
      {punto && (
        <Paper elevation={3} className="p-3 min-w-56">
          <Typography variant="caption" color="text.secondary">
            {punto.fecha.format("D/M/YYYY")}
          </Typography>
          <Typography className="font-semibold">{punto.porcentaje}% de aciertos</Typography>
          <Typography variant="caption" color="text.secondary">
            {punto.aciertos} {punto.aciertos === 1 ? "acierto" : "aciertos"} · {punto.errores}{" "}
            {punto.errores === 1 ? "error" : "errores"}
          </Typography>
          <Divider className="my-2" />
          <Stack spacing={0.5}>
            {punto.ejercicios.slice(0, EJERCICIOS_VISIBLES).map((e, i) => (
              <Stack key={i} direction="row" className="justify-between" useFlexGap sx={{ gap: 3 }}>
                <Typography variant="body2" className="flex-1">
                  {e.nombre}
                </Typography>
                {/* Aciertos sobre el total de intentos: el porcentaje solo no dice cuánto pesa ese resultado. */}
                <Typography variant="caption" color="text.secondary" className="self-center">
                  {e.aciertos} · {e.errores} {e.errores === 1 ? "error" : "errores"}
                </Typography>
                <Typography variant="body2" className="font-medium w-10 text-right">
                  {Math.round(e.porcentaje)}%
                </Typography>
              </Stack>
            ))}
            {punto.ejercicios.length > EJERCICIOS_VISIBLES && (
              <Typography variant="caption" color="text.secondary">
                y {punto.ejercicios.length - EJERCICIOS_VISIBLES} más
              </Typography>
            )}
          </Stack>
        </Paper>
      )}
    </ChartsTooltipContainer>
  );
}

interface Props {
  sesiones: SesionResumen[];
}

// Un punto por sesión con su porcentaje de aciertos. Se puede mirar todo junto o una sola área.
export default function AciertosPorSesion({ sesiones }: Props) {
  const [area, setArea] = useState(TODAS);

  const areas = useMemo(() => areasConSesiones(sesiones), [sesiones]);
  // Si el período cambia y el área elegida ya no está, se vuelve a "todas" sin romper nada.
  const elegida = area !== TODAS && areas.includes(area) ? area : TODAS;
  const puntos = useMemo(
    () => aciertosPorSesion(sesiones, elegida === TODAS ? undefined : elegida),
    [sesiones, elegida],
  );

  return (
    <>
      <TextField
        select
        size="small"
        value={elegida}
        onChange={(e) => setArea(e.target.value)}
        className="w-full sm:w-[220px]"
      >
        <MenuItem value={TODAS}>Todas las áreas</MenuItem>
        {areas.map((a) => (
          <MenuItem key={a} value={a}>
            {a}
          </MenuItem>
        ))}
      </TextField>

      {puntos.length < 2 ? (
        <Typography variant="body2" color="text.secondary">
          {puntos.length === 0
            ? "No hay sesiones para mostrar."
            : `Hay una sola sesión (${puntos[0].fecha.format("D/M")}, ${puntos[0].porcentaje}% de aciertos). Con más sesiones se va a ver la tendencia.`}
        </Typography>
      ) : (
        <PuntosContext.Provider value={puntos}>
          <LineChart
            height={260}
            hideLegend
            slots={{ tooltip: TooltipDeLaSesion }}
            // El eje usa la posición de cada sesión (no la fecha) para que dos sesiones del mismo día no se superpongan.
            xAxis={[
              {
                scaleType: "point",
                data: puntos.map((_, i) => i),
                valueFormatter: (i: number) => puntos[i].fecha.format("D/M"),
              },
            ]}
            yAxis={[{ min: 0, max: 100, valueFormatter: (v: number) => `${v}%` }]}
            series={[
              {
                data: puntos.map((p) => p.porcentaje),
                color: AZUL,
                curve: "linear", // tramos rectos: solo hay un dato por sesión, no valores entre una y otra
                showMark: true,
              },
            ]}
          />
        </PuntosContext.Provider>
      )}
    </>
  );
}
