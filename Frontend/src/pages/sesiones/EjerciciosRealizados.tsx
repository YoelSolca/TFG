import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/UseDebounce";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { formatearCuando } from "../../utils/Tiempo";
import { DateFilter, ExerciseTypeIcon, NameCell, PageHeader, TablePager } from "../../components/Common";
import { obtenerEjerciciosRealizados } from "../../actions/Sesion.action";
import { filtrarHistorialPacientePorTipoEjercicio } from "../../actions/TipoEjercicio.action";
import { TipoEjercicio } from "../../models/Paciente.model";

export default function EjerciciosRealizados() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState<Date>();
  const [tipos, setTipos] = useState<TipoEjercicio[]>([]);
  const [tipoId, setTipoId] = useState<number | "">("");

  useEffect(() => {
    filtrarHistorialPacientePorTipoEjercicio()
      .then(setTipos)
      .catch((error) => console.error("Error al obtener los tipos de ejercicio:", error));
  }, []);

  const debouncedSearch = useDebounce(search);

  const { items, page, setPage, totalPages, cargado } = useListaPaginada(
    (p) => obtenerEjerciciosRealizados(p, debouncedSearch, tipoId === "" ? undefined : tipoId, fecha),
    [debouncedSearch, tipoId, fecha],
    "Error al obtener ejercicios realizados:",
  );

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
              <MenuItem key={t.id} value={t.id}>
                {t.nombre}
              </MenuItem>
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
                onClick={() =>
                  navigate(`/sesiones/${e.sesionId}/ejercicios/${e.ejercicioId}/resultado`, {
                    state: { from: "ejercicios" },
                  })
                }
                className="cursor-pointer"
              >
                <TableCell>
                  <NameCell nombre={e.nombre} apellido={e.apellido} colorId={e.pacienteId} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5} className="items-center">
                    <ExerciseTypeIcon icon={e.tipoEjercicio} size={36} />
                    <Typography variant="body2" className="font-medium">
                      {e.ejercicio}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={e.tipoEjercicio} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{formatearCuando(e.fecha)}</TableCell>
              </TableRow>
            ))}
            {cargado && !items.length && (
              <TableRow>
                <TableCell colSpan={4} align="center" className="py-10">
                  <Typography color="text.secondary">
                    {debouncedSearch || tipoId !== "" || fecha
                      ? "No hay ejercicios que coincidan con los filtros."
                      : "Todavía no hay ejercicios realizados."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePager page={page} count={totalPages} onChange={(p) => setPage(p)} />
      </TableContainer>
    </>
  );
}
