import { useParams } from "react-router-dom";
import {
  BackButton,
  ExerciseTypeIcon,
} from "../components/common";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Checkbox,
  Grid,
  IconButton,
  Pagination,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useEffect, useState } from "react";
import { sesionEjercicios } from "../actions/sesion.action";
import { EjercicioListItem } from "../Model/ejercicio.model";
import CheckIcon from "@mui/icons-material/Check";
import { TypeFilterChips } from "./paciente/Historial";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Link as RouterLink } from "react-router-dom";

export default function NuevaSesionEjercicios() {
  const { patientId } = useParams();
  const [sesionEjercicio, setSesionEjercicio] = useState<EjercicioListItem[]>(
    [],
  );
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState<string | number>("Todas");

  const [page, setPage] = useState(1);

  useEffect(() => {
    sesionEjercicios(type === "Todas" ? undefined : Number(type), page)
      .then((response) => {
        console.log("Ejercicios obtenidos:", response);
        setSesionEjercicio(response.items);
        setTotalPages(Math.ceil(response.total / response.pageSize)); // Calcula el total de páginas según la cantidad de pacientes y el tamaño de página (10)
      })
      .catch((error) => {
        console.error("Error al obtener los ejercicios:", error);
      });
  }, [type, page]);

  return (
    <>
      <BackButton to={`/pacientes/${patientId}/informacion`}>
        Volver a Juan Perez
      </BackButton>
      <Box>
        <Stack direction="row" spacing={0.5} className="items-center">
          <Typography variant="h4" component="h1">
            Elegí los ejercicios
          </Typography>
          <IconButton size="small" color="primary">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="primary">
            <SaveOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography variant="body1" color="text.secondary" className="mt-1">
          Seleccioná los ejercicios que realizará Juan Perez durante la sesión
        </Typography>
      </Box>
      <TypeFilterChips value={type} onChange={setType} />
      <Grid container spacing={3}>
        {sesionEjercicio.map((ejercicio) => {
          return (
            <Grid key={ejercicio.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Tooltip title={ejercicio.descripcion} arrow placement="top">
                <Card
                  className="h-full"
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    p: 0.6,
                  }}
                >
                  <CardActionArea
                    className="h-full"
                    sx={{ p: 2.5, cursor: "pointer" }}
                  >
                    <Stack
                      direction="row"
                      className="items-start justify-between mb-3"
                    >
                      <ExerciseTypeIcon
                        icon={ejercicio.tipoEjercicio}
                        size={40}
                      />
                      <Checkbox
                        tabIndex={-1}
                        disableRipple
                        icon={
                          <Box
                            className="w-[22px] h-[22px] rounded-md"
                            sx={{ bgcolor: "rgba(37, 99, 235, 0.16)" }}
                          />
                        }
                        checkedIcon={
                          <Box
                            className="w-[22px] h-[22px] rounded-md grid place-items-center"
                            sx={{
                              bgcolor: "primary.main",
                              color: "common.white",
                            }}
                          >
                            <CheckIcon className="text-[16px]" />
                          </Box>
                        }
                        className="p-0"
                      ></Checkbox>
                    </Stack>
                    <Typography className="text-[16px] font-semibold">
                      {ejercicio.tipoEjercicio}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      className="mt-0.5"
                    >
                      {ejercicio.nombre}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>

      <Stack
        direction="row"
        useFlexGap
        className="gap-3 flex-wrap items-center"
      >
        <Pagination
          page={page}
          count={totalPages}
          //ver despues no entiendo bien el onChange
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          className="flex-1"
        />
        <Typography variant="body2" color="text.secondary">
          ejercicios seleccionados
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          disabled
          component={RouterLink}
          to="/sesiones/{}/ejercicios/${}"
          state={{ queue: [], index: 0 }}
        >
          Iniciar Sesión
        </Button>
      </Stack>
    </>
  );
}
