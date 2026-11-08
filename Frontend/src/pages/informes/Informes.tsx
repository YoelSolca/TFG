import { useState } from "react";
import { useDebounce } from "../../hooks/UseDebounce";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  InputAdornment,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import dayjs from "dayjs";
import { CenteredPagination, DateFilter, PageHeader, PersonAvatar } from "../../components/Common";
import GenerarInformeDialog from "../../components/GenerarInformeDialog";
import SelectPacienteDialog from "../../components/SelectPacienteDialog";
import { obtenerInformes } from "../../actions/Informe.action";
import { PacienteListItem } from "../../models/Paciente.model";
import { periodoInforme } from "../../utils/Periodo";

export default function Informes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [fecha, setFecha] = useState<Date>();
  // "Generar informe" son dos pasos: primero se elige el paciente y después el período.
  const [eligiendo, setEligiendo] = useState(false);
  const [paciente, setPaciente] = useState<PacienteListItem | null>(null);

  const debouncedSearch = useDebounce(search);

  const {
    items: informes,
    page,
    setPage,
    totalPages,
  } = useListaPaginada(
    (p) => obtenerInformes(p, debouncedSearch, fecha),
    [debouncedSearch, fecha],
    "Error al obtener informes:",
  );

  return (
    <>
      <PageHeader
        title="Informes"
        subtitle="Todos los informes generados por Inteligencia Artificial"
        action={
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => setEligiendo(true)}>
            Generar informe
          </Button>
        }
      />

      <SelectPacienteDialog
        open={eligiendo}
        onClose={() => setEligiendo(false)}
        title="Generar informe"
        description="Elegí el paciente del que querés generar el informe."
        icon={<AutoAwesomeIcon />}
        onSelect={setPaciente}
      />
      {paciente && (
        <GenerarInformeDialog
          open
          pacienteId={String(paciente.id)}
          nombrePaciente={paciente.nombre}
          origen="informes"
          onClose={() => setPaciente(null)}
        />
      )}

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
                slotProps={{
                  primary: { className: "text-[15px] font-medium" },
                  secondary: { variant: "body2", noWrap: true },
                }}
              />
            </Stack>
            <Typography variant="body2" className="flex-1 md:ml-[12%]">
              {r.resumen}
            </Typography>
          </Box>
        ))}
        {!informes.length && (
          <Typography color="text.secondary" className="p-10 text-center">
            No hay informes para mostrar.
          </Typography>
        )}
      </Card>

      {informes.length > 0 && <CenteredPagination page={page} count={totalPages} onChange={(p) => setPage(p)} />}
    </>
  );
}
