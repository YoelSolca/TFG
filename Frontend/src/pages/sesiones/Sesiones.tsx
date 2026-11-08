import { useNavigate } from "react-router-dom";
import { useDebounce } from "../../hooks/UseDebounce";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import {
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  TextField,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { obtenerSesiones } from "../../actions/Sesion.action";
import { DateFilter, NameCell, PageHeader, TablePager } from "../../components/Common";
import NuevaSesionDialog from "../../components/NuevaSesionDialog";

export default function Sesiones() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState<Date>();

  const debouncedSearch = useDebounce(search);

  const {
    items: sessions,
    page,
    setPage,
    totalPages,
  } = useListaPaginada(
    (p) => obtenerSesiones(p, debouncedSearch, fecha),
    [debouncedSearch, fecha],
    "Error al obtener sesiones:",
  );

  return (
    <>
      <PageHeader
        title="Sesiones"
        subtitle="Todas las sesiones registradas"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
            Nueva sesión
          </Button>
        }
      />
      <NuevaSesionDialog open={creating} onClose={() => setCreating(false)} />

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
        <DateFilter date={fecha} onChange={(d) => setFecha(d)} />
      </Stack>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="w-[260px]">Paciente</TableCell>
              <TableCell className="w-[160px]">Fecha</TableCell>
              <TableCell className="w-[140px]">Hora</TableCell>
              <TableCell className="w-[320px]">Objetivos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((s) => (
              <TableRow key={s.id} hover onClick={() => navigate(`/sesiones/${s.id}`)} className="cursor-pointer">
                <TableCell>
                  <NameCell nombre={s.nombre} apellido={s.apellido} colorId={s.pacienteId} />
                </TableCell>
                <TableCell>{s.fecha ? new Date(s.fecha).toLocaleDateString("es-AR") : "-"}</TableCell>
                <TableCell>
                  {s.fecha
                    ? new Date(s.fecha).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : "-"}
                </TableCell>
                <TableCell>{s.objetivo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePager page={page} count={totalPages} onChange={(p) => setPage(p)} />
      </TableContainer>
    </>
  );
}
