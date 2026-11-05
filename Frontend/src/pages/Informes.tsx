import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, InputAdornment, ListItemAvatar, ListItemText, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";
import { CenteredPagination, DateFilter, PageHeader, PersonAvatar } from "../components/common";
import { obtenerInformes } from "../actions/informe.action";
import { InformeListItem } from "../Model/sesion.model";
import { periodoInforme } from "../utils/periodo";

export default function Informes() {
  const navigate = useNavigate();
  const [informes, setInformes] = useState<InformeListItem[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fecha, setFecha] = useState<Date>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // al cambiar un filtro se vuelve a la primera página
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, fecha]);

  useEffect(() => {
    obtenerInformes(page, debouncedSearch, fecha)
      .then((response) => {
        setInformes(response.items);
        setTotalPages(Math.max(1, Math.ceil(response.total / response.pageSize)));
      })
      .catch((error) => console.error("Error al obtener informes:", error));
  }, [debouncedSearch, fecha, page]);

  return (
    <>
      <PageHeader title="Informes" subtitle="Todos los informes generados por Inteligencia Artificial" />

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

      <Card>
        {informes.map((r, i) => (
          <Box
            key={r.id}
            onClick={() => navigate(`/pacientes/${r.pacienteId}/informes/${r.id}`, { state: { from: "informes" } })}
            className="flex flex-col md:flex-row gap-3 md:gap-0 items-start md:items-center px-6 py-2 cursor-pointer"
            sx={{
              borderBottom: i < informes.length - 1 ? 1 : 0,
              borderColor: "divider",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Stack direction="row" className="items-center md:w-[380px] shrink-0 py-2">
              <ListItemAvatar>
                <PersonAvatar initials={r.nombre.charAt(0) + r.apellido.charAt(0)} colorId={r.pacienteId} />
              </ListItemAvatar>
              <ListItemText
                primary={`${r.nombre} ${r.apellido}`}
                secondary={`${dayjs(r.fechaGeneracion).format("DD/MM/YYYY")} · ${periodoInforme(r.periodoDesde, r.periodoHasta)}`}
                slotProps={{ primary: { className: "text-[15px] font-medium" }, secondary: { variant: "body2", noWrap: true } }}
              />
            </Stack>
            <Typography variant="body2" className="flex-1 md:ml-[12%]">{r.resumen}</Typography>
          </Box>
        ))}
        {!informes.length && (
          <Typography color="text.secondary" className="p-10 text-center">No hay informes para mostrar.</Typography>
        )}
      </Card>

      {informes.length > 0 && <CenteredPagination page={page} count={totalPages} onChange={(p) => setPage(p)} />}
    </>
  );
}
