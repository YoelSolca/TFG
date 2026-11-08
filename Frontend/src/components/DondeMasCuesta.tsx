import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { EjercicioDificil } from "../utils/Evolucion";

interface Props {
  ejercicios: EjercicioDificil[];
}

// Los ejercicios con menos aciertos del período, para saber qué mirar primero.
export default function DondeMasCuesta({ ejercicios }: Props) {
  if (ejercicios.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No hay ejercicios con errores en este período.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {ejercicios.map((e) => (
        <Box key={e.nombre}>
          <Stack direction="row" className="justify-between items-baseline" useFlexGap sx={{ gap: 1 }}>
            <Typography variant="body2" className="font-medium">
              {e.nombre}{" "}
              <Typography component="span" variant="caption" color="text.secondary">
                · {e.area} · {e.veces} {e.veces === 1 ? "vez" : "veces"}
              </Typography>
            </Typography>
            <Typography variant="body2" className="font-semibold">
              {e.porcentaje}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={e.porcentaje} className="h-2 rounded-[32px]" />
          <Typography variant="caption" color="text.secondary">
            {e.errores} {e.errores === 1 ? "error" : "errores"}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
