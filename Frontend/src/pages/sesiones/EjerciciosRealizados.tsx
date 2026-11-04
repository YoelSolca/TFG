import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Chip, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import { DateFilter, ExerciseTypeIcon, PageHeader, PersonAvatar, TablePager } from "../../components/common";
import { obtenerEjerciciosRealizados } from "../../actions/sesion.action";
import { filtrarHistorialPacientePorTipoEjercicio } from "../../actions/tipoEjercicio.action";
import { TipoEjercicio } from "../../Model/paciente.model";
import { EjercicioRealizadoItem } from "../../Model/sesion.model";

function NameCell({ initials, name, colorId }: { initials: string; name: string; colorId?: number }) {
  return (
    <Stack direction="row" spacing={1.5} className="items-center">
      <PersonAvatar initials={initials} size={32} colorId={colorId} />
      <Typography variant="body2" className="font-medium">{name}</Typography>
    </Stack>
  );
}

function formatearCuando(fecha: string) {
  const d = dayjs(fecha);
  const horas = dayjs().diff(d, "hour");
  if (horas >= 0 && horas < 24) {
    return horas < 1 ? "Hace menos de 1 h" : `Hace ${horas} h`;
  }
  return d.format("DD/MM/YYYY · HH:mm");
}

export default function EjerciciosRealizados() {
  const navigate = useNavigate();
  const [items, setItems] = useState<EjercicioRealizadoItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fecha, setFecha] = useState<Date>();
  const [tipos, setTipos] = useState<TipoEjercicio[]>([]);
  const [tipoId, setTipoId] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    filtrarHistorialPacientePorTipoEjercicio()
      .then(setTipos)
      .catch((error) => console.error("Error al obtener los tipos de ejercicio:", error));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // al cambiar un filtro se vuelve a la primera página
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tipoId, fecha]);

  useEffect(() => {
    obtenerEjerciciosRealizados(page, debouncedSearch, tipoId === "" ? undefined : tipoId, fecha)
      .then((response) => {
        setItems(response.items);
        setTotalPages(Math.max(1, Math.ceil(response.total / response.pageSize)));
      })
      .catch((error) => console.error("Error al obtener ejercicios realizados:", error));
  }, [debouncedSearch, tipoId, fecha, page]);

  return (
    <>
      <PageHeader title="Ejercicios realizados" subtitle="Actividad reciente de tus pacientes" />

      <Stack direction="row" useFlexGap className="gap-4 flex-wrap justify-between">
        <TextField
          size="small"
          placeholder="Buscar por nombre o apellido"
          className="w-full sm:w-[360px] bg-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" useFlexGap className="gap-4 flex-wrap">
          <TextField
            select
            size="small"
            label="Tipo de ejercicio"
            className="w-[200px] bg-white"
            value={tipoId}
            onChange={(e) => setTipoId(e.target.value === "" ? "" : Number(e.target.value))}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {tipos.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>
            ))}
          </TextField>      
          <DateFilter date={fecha} onChange={(d) => setFecha(d)} />
        </Stack>
      </Stack>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="w-[260px]">Paciente</TableCell>
              <TableCell className="w-[300px]">Ejercicio</TableCell>
              <TableCell className="w-[180px]">Tipo</TableCell>
              <TableCell className="w-[200px]">Cuándo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((e) => (
              <TableRow
                key={`${e.sesionId}-${e.ejercicioId}`}
                hover
                onClick={() => navigate(`/sesiones/${e.sesionId}/ejercicios/${e.ejercicioId}/resultado`, { state: { from: "ejercicios" } })}
                className="cursor-pointer"
              >
                <TableCell><NameCell initials={e.nombre.charAt(0) + e.apellido.charAt(0)} name={`${e.nombre} ${e.apellido}`} colorId={e.pacienteId} /></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5} className="items-center">
                    <ExerciseTypeIcon icon={e.tipoEjercicio} size={36} />
                    <Typography variant="body2" className="font-medium">{e.ejercicio}</Typography>
                  </Stack>
                </TableCell>
                <TableCell><Chip label={e.tipoEjercicio} size="small" variant="outlined" /></TableCell>
                <TableCell>{formatearCuando(e.fecha)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePager page={page} count={totalPages} onChange={(p) => setPage(p)} />
      </TableContainer>
    </>
  );
}
