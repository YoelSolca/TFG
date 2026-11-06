import { Box, Card, CardActionArea, Checkbox, Stack, Tooltip, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { ExerciseTypeIcon } from "./Common";
import { EjercicioListItem } from "../models/Ejercicio.model";

// Tarjeta de un ejercicio del catálogo que se puede marcar para armar el plan de una sesión.
export default function TarjetaEjercicio({
  ejercicio,
  elegido,
  onAlternar,
}: {
  ejercicio: EjercicioListItem;
  elegido: boolean;
  onAlternar: () => void;
}) {
  return (
    <Tooltip title={ejercicio.descripcion ?? ""} arrow placement="top">
      <Card
        className="h-full"
        sx={{
          border: 1,
          borderColor: elegido ? "primary.main" : "divider",
          bgcolor: "background.paper",
          p: 0.6,
        }}
      >
        <CardActionArea className="h-full" sx={{ p: 2.5, cursor: "pointer" }} onClick={onAlternar}>
          <Stack direction="row" className="items-start justify-between mb-3">
            <ExerciseTypeIcon icon={ejercicio.tipoEjercicio} size={40} />
            <Checkbox
              tabIndex={-1}
              disableRipple
              checked={elegido}
              sx={{ pointerEvents: "none" }}
              icon={<Box className="w-[22px] h-[22px] rounded-md" sx={{ bgcolor: "rgba(37, 99, 235, 0.16)" }} />}
              checkedIcon={
                <Box
                  className="w-[22px] h-[22px] rounded-md grid place-items-center"
                  sx={{ bgcolor: "primary.main", color: "common.white" }}
                >
                  <CheckIcon className="text-[16px]" />
                </Box>
              }
              className="p-0"
            />
          </Stack>
          <Typography className="text-[16px] font-semibold">{ejercicio.tipoEjercicio}</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-0.5">
            {ejercicio.nombre}
          </Typography>
        </CardActionArea>
      </Card>
    </Tooltip>
  );
}
