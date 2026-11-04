import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import dayjs from "dayjs";
import { BackButton, ExerciseTypeIcon, PageHeader, TablePager } from "../../components/common";
import { obtenerEjerciciosSesion, obtenerSesion } from "../../actions/sesion.action";
import { SesionEjercicioItem, SesionListItem } from "../../Model/sesion.model";
import { formatearTiempo } from "../../utils/tiempo";

export default function SesionEjercicios() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<SesionListItem | null>(null);
  const [ejercicios, setEjercicios] = useState<SesionEjercicioItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cabecera: paciente, fecha y hora de la sesión
  useEffect(() => {
    obtenerSesion(id!)
      .then(setSesion)
      .catch((error) => console.error("Error al obtener la sesión:", error));
  }, [id]);

  // Ejercicios de la sesión, de a una página
  useEffect(() => {
    obtenerEjerciciosSesion(id!, page)
      .then((response) => {
        setEjercicios(response.items);
        setTotalPages(Math.max(1, Math.ceil(response.total / response.pageSize)));
      })
      .catch((error) => console.error("Error al obtener los ejercicios de la sesión:", error));
  }, [id, page]);

  return (
    <>
      <BackButton to="/sesiones">Volver a sesiones</BackButton>
      <PageHeader
        title="Ejercicios de la sesión"
        subtitle={sesion ? `${sesion.nombre} ${sesion.apellido} · ${dayjs(sesion.fecha).format("DD/MM/YYYY · HH:mm")} hs` : ""}
      />

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="w-[320px]">Ejercicio</TableCell>
              <TableCell className="w-[220px]">Tipo</TableCell>
              <TableCell className="w-[180px]">Tiempo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ejercicios.map((e) => (
              <TableRow
                key={e.ejercicioId}
                hover
                onClick={() => navigate(`/sesiones/${id}/ejercicios/${e.ejercicioId}/resultado`)}
                className="cursor-pointer"
              >
                <TableCell>
                  <Stack direction="row" spacing={1.5} className="items-center">
                    <ExerciseTypeIcon icon={e.tipoEjercicio} size={36} />
                    <Typography variant="body2" className="font-medium">{e.ejercicio}</Typography>
                  </Stack>
                </TableCell>
                <TableCell><Chip label={e.tipoEjercicio} size="small" variant="outlined" /></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} className="items-center">
                    <TimerOutlinedIcon fontSize="small" color="action" />
                    <Typography variant="body2">{formatearTiempo(e.tiempoSegundos)}</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!ejercicios.length && (
              <TableRow>
                <TableCell colSpan={3} align="center" className="py-10">
                  <Typography color="text.secondary">Esta sesión no tiene ejercicios.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePager page={page} count={totalPages} onChange={setPage} />
      </TableContainer>
    </>
  );
}
