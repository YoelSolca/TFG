import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Alert, Box, Breadcrumbs, Card, Grid, Stack, TextField, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import dayjs from "dayjs";
import { BackButton } from "../../components/common";
import { obtenerResultadoEjercicio } from "../../actions/sesion.action";
import { ResultadoDetalle } from "../../Model/sesion.model";
import { formatearTiempo } from "../../utils/tiempo";

export default function EjercicioResultado() {
  const { id, ejercicioId } = useParams();
  const [resultado, setResultado] = useState<ResultadoDetalle | null>(null);
  const [error, setError] = useState(false);
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
  // "Movimientos" viene como una métrica más del resultado
  const movimientos = resultado?.metricas.find((m) => m.nombre === "movimientos")?.valor;

  const stats = [
    { label: "Aciertos", icon: CheckCircleIcon, bg: "#E8F5E9", color: "#2E7D32", value: resultado?.aciertos },
    { label: "Error", icon: CancelIcon, bg: "#FDECEA", color: "#C62828", value: resultado?.errores },
    {
      label: "Tiempo",
      icon: AccessTimeIcon,
      bg: "#E3F2FD",
      color: "#1565C0",
      value: resultado?.tiempoSegundos == null ? undefined : formatearTiempo(resultado.tiempoSegundos),
    },
    { label: "Movimientos", icon: ShowChartIcon, bg: "#F3E8FD", color: "#6A1B9A", value: movimientos },
  ];

  return (
    <>
      <BackButton to={backTo}>{backLabel}</BackButton>

      {error && <Alert severity="error">No encontramos este ejercicio en la sesión.</Alert>}

      {resultado && (
        <>
          <Box>
            <Breadcrumbs separator="•" className="text-[14px] mb-2" sx={{ color: "text.secondary" }}>
              <Typography variant="body2" color="text.secondary">Ejercicio</Typography>
              <Typography variant="body2" color="text.secondary">{resultado.tipoEjercicio}</Typography>
              <Typography variant="body2" color="text.secondary">{resultado.ejercicio}</Typography>
            </Breadcrumbs>
            <Typography variant="h4" className="font-bold">Resultado del ejercicio</Typography>
            <Typography variant="body2" color="text.secondary" className="mt-1">
              {dayjs(resultado.fecha).format("DD/MM/YYYY")} · {dayjs(resultado.fecha).format("HH:mm")} hs · {resultado.nombre} {resultado.apellido}
            </Typography>
          </Box>

          {!registrado && <Alert severity="info">Este ejercicio todavía no tiene un resultado registrado.</Alert>}

          <Grid container spacing={3}>
            {stats.map(({ label, icon: Icon, bg, color, value }) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card className="p-5">
                  <Stack direction="row" className="justify-between items-start">
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Box className="w-8 h-8 rounded-full grid place-items-center" sx={{ bgcolor: bg, color }}>
                      <Icon fontSize="small" />
                    </Box>
                  </Stack>
                  <Typography className="text-[32px] font-bold mt-2">{registrado && value != null ? value : "-"}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card className="p-6">
            <Typography variant="subtitle1" className="mb-3">Observaciones:</Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={resultado.observaciones ?? ""}
              placeholder="Sin observaciones"
              slotProps={{ input: { readOnly: true } }}
            />
          </Card>
        </>
      )}
    </>
  );
}
