import { Box, Stack, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { EjerciciosDeArea } from "../utils/Evolucion";

// Un color por área, siempre el mismo orden: así se reconoce cada una de un vistazo.
const COLORES = ["#2563eb", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#64748b"];
const SIN_EJERCICIOS = "#cbd5e1";

const TAMANIO = 200;

interface Props {
  areas: EjerciciosDeArea[];
}

// Dona con el reparto de ejercicios entre áreas, y al costado la leyenda con la cantidad de cada una.
// Las áreas sin ejercicios no se dibujan, pero quedan en la leyenda en gris: que no se trabajen también es un dato.
export default function EjerciciosPorArea({ areas }: Props) {
  const total = areas.reduce((suma, a) => suma + a.cantidad, 0);

  const color = (indice: number, cantidad: number) =>
    cantidad === 0 ? SIN_EJERCICIOS : COLORES[indice % COLORES.length];

  // Con una sola área la dona es un círculo completo (sin separación entre porciones, porque no hay otra).
  const separacion = areas.filter((a) => a.cantidad > 0).length > 1 ? 2 : 0;

  return (
    <Stack direction={{ xs: "column", sm: "row" }} useFlexGap className="gap-6 items-center justify-center">
      {total > 0 && (
        <Box className="relative shrink-0" sx={{ width: TAMANIO, height: TAMANIO }}>
          <PieChart
            width={TAMANIO}
            height={TAMANIO}
            margin={0}
            hideLegend
            series={[
              {
                innerRadius: 62,
                outerRadius: 96,
                paddingAngle: separacion,
                cornerRadius: 3,
                data: areas
                  .map((a, i) => ({ id: a.area, label: a.area, value: a.cantidad, color: color(i, a.cantidad) }))
                  .filter((d) => d.value > 0),
                // El tooltip dice cuáles fueron los ejercicios, no solo cuántos.
                valueFormatter: ({ value }, { dataIndex }) => {
                  const area = areas.filter((a) => a.cantidad > 0)[dataIndex];
                  const nombres = area?.ejercicios.map((e) =>
                    e.cantidad > 1 ? `${e.nombre} (${e.cantidad})` : e.nombre,
                  );
                  return `${value} ${value === 1 ? "ejercicio" : "ejercicios"}: ${nombres?.join(", ")}`;
                },
              },
            ]}
          />
          <Stack className="absolute inset-0 items-center justify-center pointer-events-none">
            <Typography variant="h4" className="font-bold leading-none">
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {total === 1 ? "ejercicio" : "ejercicios"}
            </Typography>
          </Stack>
        </Box>
      )}

      <Stack spacing={1} className="min-w-52">
        {areas.map((a, i) => (
          <Stack key={a.area} direction="row" spacing={1.5} className="items-center">
            <Box className="w-3 h-3 rounded-full shrink-0" sx={{ bgcolor: color(i, a.cantidad) }} />
            <Box className="flex-1">
              <Typography variant="body2" color={a.cantidad === 0 ? "text.disabled" : "text.primary"}>
                {a.area}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              className="font-semibold"
              color={a.cantidad === 0 ? "text.disabled" : "text.primary"}
            >
              {a.cantidad}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
