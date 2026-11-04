import { useNavigate } from "react-router-dom";
import { Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, Typography, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { obtenerSesiones } from "../../actions/sesion.action";
import { DateFilter, PageHeader, PersonAvatar, TablePager } from "../../components/common";
import { SesionListItem } from "../../Model/sesion.model";

export default function Sesiones() {
    const navigate = useNavigate();
    const [, setCreating] = useState(false);
    const [sessions, setSessions] = useState<SesionListItem[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [fecha, setFecha] = useState<Date>();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

      useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
      }, [search]);

    useEffect(() => {
        try {
            obtenerSesiones(page, debouncedSearch, fecha)
            .then((response) => {
                console.log("Sesiones obtenidas:", response);
                setSessions(response.items);
               setTotalPages(Math.ceil(response.total / response.pageSize)); // Calcula el total de páginas según la cantidad de pacientes y el tamaño de página (10)
            })
        } catch (error) {
            console.error("Error al obtener sesiones:", error);
        }
    }, [debouncedSearch, fecha, page]);


function NameCell({ initials, name, colorId }: { initials: string; name: string; colorId?: number }) {
  return (
    <Stack direction="row" spacing={1.5} className="items-center">
      <PersonAvatar initials={initials} size={32} colorId={colorId} />
      <Typography variant="body2" className="font-medium">{name}</Typography>
    </Stack>
  );
}

   return (
    <>
      <PageHeader
        title="Sesiones"
        subtitle="Todas las sesiones registradas"
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>Nueva sesión</Button>}
      />
      
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
                <TableCell><NameCell initials={s.nombre.charAt(0) + s.apellido.charAt(0)} name={s.nombre + " " + s.apellido} colorId={s.pacienteId} /></TableCell>
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
         <TablePager
            page={page}
            count={totalPages}
            onChange={(p) => setPage(p)}
                />
      </TableContainer>
    </>
  );
}
