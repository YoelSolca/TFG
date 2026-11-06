import { Box, Card, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { obtenerInformesPaciente } from "../../actions/Pacientes.action";
import { PacienteInformeItem } from "../../models/Informe.model";
import { CenteredPagination, DateFilter, IconBox } from "../../components/Common";
import DescriptionIcon from "@mui/icons-material/Description";
import dayjs from "dayjs";
import "dayjs/locale/es";

export default function InformesPacientes() {
  const [informes, setInformes] = useState<PacienteInformeItem[]>([]);
  const { id } = useParams();
  const [fecha, setFecha] = useState<Date>();
  const [page, setPage] = useState(1); // la página que se está viendo
  const [totalPages, setTotalPages] = useState(1);
  const [cargado, setCargado] = useState(false); // evita mostrar "Todavía no hay informes" mientras llegan los datos
  const navigate = useNavigate();

  useEffect(() => {
    obtenerInformesPaciente(id!, fecha)
      .then((response) => {
        setInformes(response.items);
        setTotalPages(Math.ceil(response.total / response.pageSize));
      })
      .catch((error) => {
        console.error("Error al obtener informes del paciente:", error);
      })
      .finally(() => setCargado(true));
  }, [fecha, id, page]);

  return (
    <>
      <Stack direction="row" useFlexGap className="gap-4 flex-wrap items-center justify-between">
        <Typography className="text-[16px] font-medium">
          {informes.length} {informes.length === 1 ? "informe generado" : "informes generados"}
        </Typography>
        <DateFilter date={fecha} onChange={(s) => setFecha(s)} />
      </Stack>

      {cargado &&
        informes.length === 0 &&
        (fecha ? (
          <Card className="p-6">
            <Typography color="text.secondary">No hay informes generados en esa fecha.</Typography>
          </Card>
        ) : (
          <Card className="p-10 flex flex-col items-center gap-3 text-center">
            <Typography>No hay informes para mostrar.</Typography>
          </Card>
        ))}

      {informes.length > 0 && (
        <Card>
          {informes.map((informe, i) => (
            <Box
              key={informe.id}
              onClick={() =>
                navigate(`/pacientes/${id}/informes/${informe.id}`, {
                  state: { from: "paciente" },
                })
              }
              className="flex flex-col md:flex-row gap-3 md:gap-0 items-start md:items-center px-6 py-4 cursor-pointer"
              sx={{
                borderBottom: i < informes.length - 1 ? 1 : 0,
                borderColor: "divider",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <IconBox icon={DescriptionIcon} size={40} />
              <Box className="md:w-[170px] shrink-0 ml-0 md:ml-3">
                <Typography variant="body2" noWrap className="font-medium">
                  {dayjs(informe.fechaGeneracion).format("DD/MM/YYYY")}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {dayjs(informe.periodoDesde)
                    .locale("es")
                    .format("MMMM")
                    .replace(/^\w/, (c) => c.toUpperCase())}{" "}
                  -{" "}
                  {dayjs(informe.periodoHasta)
                    .locale("es")
                    .format("MMMM")
                    .replace(/^\w/, (c) => c.toUpperCase())}
                </Typography>
              </Box>
              <Typography variant="body2" className="flex-1 md:ml-[12%]">
                {informe.resumen}
              </Typography>
            </Box>
          ))}
        </Card>
      )}

      {informes.length > 0 && <CenteredPagination page={page} onChange={(p) => setPage(p)} count={totalPages} />}
    </>
  );
}
