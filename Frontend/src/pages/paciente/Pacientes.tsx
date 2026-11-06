import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/UseDebounce";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import type { TipoDificultad } from "../../models/Paciente.model";
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
import { formatearEdad } from "../../utils/Edad";
import { useNavigate } from "react-router-dom";
import { PageHeader, PersonAvatar, TablePager } from "../../components/Common";
import SearchIcon from "@mui/icons-material/Search";
import { obtenerPacientes } from "../../actions/Pacientes.action";
import { obtenerTiposDificultad } from "../../actions/TiposDificultad.action";
function Pacientes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tiposDificultad, setTiposDificultad] = useState<TipoDificultad[]>([]);
  const [tipoId, setTipoId] = useState<number | "">("");

  // Se actualiza 300 ms después de que el usuario deja de escribir, para no pedir al servidor en cada tecla.
  const debouncedSearch = useDebounce(search);

  const {
    items: pacientes,
    page,
    setPage,
    totalPages,
  } = useListaPaginada(
    (p) => obtenerPacientes(debouncedSearch, tipoId === "" ? undefined : tipoId, p),
    [debouncedSearch, tipoId],
    "Error al obtener pacientes:",
  );

  useEffect(() => {
    obtenerTiposDificultad()
      .then((response) => {
        setTiposDificultad(response);
      })
      .catch((error) => console.error("Error al obtener tipos de dificultad:", error));
  }, []);

  return (
    <>
      <PageHeader
        title="Pacientes"
        subtitle="Lista de pacientes a tu cargo"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/pacientes/nuevo")}>
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
                    <PersonAvatar initials={p.nombre.charAt(0) + p.apellido.charAt(0)} size={32} colorId={p.id} />
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
        <TablePager page={page} count={totalPages} onChange={(p) => setPage(p)} />
      </TableContainer>
    </>
  );
}

export default Pacientes;
