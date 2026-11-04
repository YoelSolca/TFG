import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Alert, Box, Button, Card, Chip, Divider, Stack, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import dayjs from "dayjs";
import { BackButton } from "../components/common";
import { obtenerInforme } from "../actions/informe.action";
import { InformeDetalle as InformeDetalleModel } from "../Model/sesion.model";
import { formatearEdad } from "../utils/edad";
import { periodoInforme } from "../utils/periodo";

export default function InformeDetalle() {
  const { id, informeId } = useParams();
  const location = useLocation();
  const [informe, setInforme] = useState<InformeDetalleModel | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    obtenerInforme(informeId!)
      .then((data) => {
        // el informe tiene que ser del paciente de la URL
        if (data.pacienteId !== Number(id)) setError(true);
        else setInforme(data);
      })
      .catch(() => setError(true));
  }, [id, informeId]);

  const fromPaciente = location.state?.from === "paciente";
  const backTo = fromPaciente ? `/pacientes/${id}` : "/informes";
  const backLabel = fromPaciente && informe ? `Volver a ${informe.nombre} ${informe.apellido}` : fromPaciente ? "Volver al paciente" : "Volver a informes";

  return (
    <>
      <BackButton to={backTo}>{backLabel}</BackButton>

      {error && <Alert severity="error">No encontramos este informe.</Alert>}

      {informe && (
        <Card className="p-8 flex flex-col gap-5">
          <Stack direction="row" useFlexGap className="no-print gap-3 flex-wrap justify-end">
            <Button variant="outlined" startIcon={<DownloadIcon />}>Descargar PDF</Button>
          </Stack>
          <Stack direction="row" className="items-start justify-between">
            <Box>
              <Typography variant="h5" component="h2">Informe {periodoInforme(informe.periodoDesde, informe.periodoHasta)}</Typography>
              <Typography variant="body2" color="text.secondary" className="mt-1">
                {informe.nombre} {informe.apellido} · DNI {Number(informe.documento).toLocaleString("es-AR")}
                {informe.fechaNacimiento && ` · ${formatearEdad(informe.fechaNacimiento)}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Período analizado: {dayjs(informe.periodoDesde).format("DD/MM/YYYY")} - {dayjs(informe.periodoHasta).format("DD/MM/YYYY")}
              </Typography>
            </Box>
            <Chip icon={<AutoAwesomeIcon />} label="Generado con IA" color="primary" variant="outlined" className="no-print" />
          </Stack>
          <Divider />
          <Typography variant="h6" component="h3">Resumen conceptual</Typography>
          <Typography variant="body1" className="leading-[26px]">{informe.contenido}</Typography>
          <Divider />
          <Stack direction="row" spacing={1} className="items-center" sx={{ color: "text.secondary" }}>
            <CalendarTodayOutlinedIcon fontSize="small" />
            <Typography variant="body2">Generado el {dayjs(informe.fechaGeneracion).format("DD/MM/YYYY")}</Typography>
          </Stack>
        </Card>
      )}
    </>
  );
}
