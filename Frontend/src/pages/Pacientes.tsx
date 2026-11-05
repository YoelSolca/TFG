import { useEffect, useState } from "react";
import type { PacienteListItem, TipoDificultad } from "../Model/paciente.model";
import {
  Button,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Table,
  Card,
  Chip,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { formatearEdad } from "../utils/edad";
import { useNavigate } from "react-router-dom";
import { PageHeader, PersonAvatar, TablePager } from "../components/common";
import SearchIcon from "@mui/icons-material/Search";
import { obtenerPacientes } from "../actions/pacientes.action";
import { obtenerTiposDificultad } from "../actions/tiposDificultad.action";
function Pacientes() {
  const [pacientes, setPacientes] = useState<PacienteListItem[]>([]);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tiposDificultad, setTiposDificultad] = useState<TipoDificultad[]>([]);
  const [tipoId, setTipoId] = useState<number | "">("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1); // la página que se está viendo
  const [totalPages, setTotalPages] = useState(1);

  // Estado para almacenar el valor de búsqueda con debounce
  //debouncedSearch se actualiza después de un retraso de 300 ms desde la última vez que el usuario escribió en el campo de búsqueda.
  //setDebouncedSearch se utiliza para actualizar el estado de debouncedSearch después del retraso.


  //Se ejecuta cada vez que el valor de search cambia, y establece un temporizador para actualizar debouncedSearch después de 300 ms.
  // Esto ayuda a reducir la cantidad de solicitudes de búsqueda mientras el usuario está escribiendo.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    obtenerPacientes(
      debouncedSearch,
      tipoId === "" ? undefined : tipoId,
      page,
    )
      .then((response) => {
        setPacientes(response.items);
        setTotalPages(Math.ceil(response.total / response.pageSize)); // Calcula el total de páginas según la cantidad de pacientes y el tamaño de página (10)
      })
      .catch((error) => {
        console.error("Error al obtener pacientes:", error);
      });
  }, [debouncedSearch, tipoId, page]); // Se ejecuta cada vez que debouncedSearch o tipoId cambian, y realiza la solicitud para obtener los pacientes filtrados según los criterios de búsqueda y tipo de dificultad seleccionados.

  useEffect(() => {
    obtenerTiposDificultad()
      .then((response) => {
        setTiposDificultad(response);
      })
      .catch((error) =>
        console.error("Error al obtener tipos de dificultad:", error),
      );
  }, []);

  return (
    <>
      <PageHeader
        title="Pacientes"
        subtitle="Lista de pacientes a tu cargo"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/pacientes/nuevo")}
          >
            Nuevo paciente
          </Button>
        }
      />

      <Stack direction="row" useFlexGap className="gap-4 flex-wrap">
        <TextField
          size="small"
          placeholder="Buscar por nombre o documento"
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
        <TextField
          select
          size="small"
          label="Tipo de dificultad"
          value={tipoId}
          className="w-full sm:w-[240px] bg-white"
          slotProps={{
            select: { displayEmpty: true },
            inputLabel: { shrink: true },
          }}
          onChange={(e) => {
            setTipoId(e.target.value === "" ? "" : Number(e.target.value));
          }}
        >
          <MenuItem value="">Todos</MenuItem>
          {tiposDificultad.map((d) => (
            <MenuItem key={d.id} value={d.id}>
              {d.nombre}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer component={Card}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Nombre y apellido</TableCell>
              <TableCell>Número de documento</TableCell>
              <TableCell>Edad</TableCell>
              <TableCell>Tipo de dificultad</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pacientes.map((p) => (
              <TableRow
                key={p.id}
                hover
                className="cursor-pointer"
                onClick={() => navigate(`/pacientes/${p.id}/informacion`)}
              >
                <TableCell component="th" scope="row">
                  <Stack direction="row" spacing={1.5} className="items-center">
                    <PersonAvatar
                      initials={p.nombre.charAt(0) + p.apellido.charAt(0)}
                      size={32}
                      colorId={p.id}
                    />
                    <Typography variant="body2" className="font-medium">
                      {p.nombre} {p.apellido}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{p.documento}</TableCell>
                <TableCell>{formatearEdad(p.fechaNacimiento)}</TableCell>
                <TableCell>
                  {p.tiposDificultad.map((t) => (
                    <Chip key={t} label={t} size="small" variant="outlined" />
                  ))}
                </TableCell>
              </TableRow>
            ))}

            {pacientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No se encontraron pacientes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePager
          page={page}
          count={totalPages}
          onChange={(p) => setPage(p)}
        />
      </TableContainer>
    </>
  );
}

export default Pacientes;
