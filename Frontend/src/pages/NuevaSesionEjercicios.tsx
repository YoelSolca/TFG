import { useNavigate, useParams } from "react-router-dom";
import { BackButton, ExerciseTypeIcon } from "../components/common";
import {
  Alert,
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
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import axios from "axios";
import {
  actualizarSesion,
  crearSesion,
  iniciarSesion,
  obtenerPlanSesion,
  sesionEjercicios,
} from "../actions/sesion.action";
import { obtenerPacientePorId } from "../actions/pacientes.action";
import { EjercicioListItem } from "../Model/ejercicio.model";
import { PacienteDetalle } from "../Model/PacienteDetalle.model";
import { SesionPlan } from "../Model/sesion.model";
import CheckIcon from "@mui/icons-material/Check";
import { TypeFilterChips } from "./paciente/Historial";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const mismosEjercicios = (a: number[], b: number[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

export default function NuevaSesionEjercicios() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null);
  const [cargaFallida, setCargaFallida] = useState("");
  // Plan guardado del paciente (null si todavía no tiene) y selección actual, en el orden en que se eligió.
  const [plan, setPlan] = useState<SesionPlan | null>(null);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");
  const [serverError, setServerError] = useState("");

  const [sesionEjercicio, setSesionEjercicio] = useState<EjercicioListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState<string | number>("Todas");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!patientId) return;
    Promise.all([obtenerPacientePorId(patientId), obtenerPlanSesion(patientId)])
      .then(([pacienteResponse, planResponse]) => {
        setPaciente(pacienteResponse);
        setPlan(planResponse);
        setSeleccion(planResponse?.ejercicioIds ?? []);
      })
      .catch((error) => {
        const noExiste = axios.isAxiosError(error) && error.response?.status === 404;
        setCargaFallida(
          noExiste
            ? "No encontramos al paciente."
            : "No pudimos cargar los datos de la sesión. Intentá de nuevo más tarde.",
        );
      });
  }, [patientId]);

  useEffect(() => {
    sesionEjercicios(type === "Todas" ? undefined : Number(type), page)
      .then((response) => {
        setSesionEjercicio(response.items);
        setTotalPages(Math.max(1, Math.ceil(response.total / response.pageSize)));
      })
      .catch((error) => {
        console.error("Error al obtener los ejercicios:", error);
      });
  }, [type, page]);

  // Cambiar el filtro vuelve a la primera página: la actual puede no existir con el nuevo filtro.
  const cambiarTipo: Dispatch<SetStateAction<string | number>> = (value) => {
    setType(value);
    setPage(1);
  };

  const alternar = (id: number) =>
    setSeleccion((actual) =>
      actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id],
    );

  const hayCambios = plan
    ? !mismosEjercicios(seleccion, plan.ejercicioIds)
    : seleccion.length > 0;

  const mensajeDeError = (error: unknown) => {
    const detalle = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
    return detalle ?? "No se pudo guardar la sesión. Intentá de nuevo.";
  };

  // Guarda la selección como plan del paciente: lo crea la primera vez y después lo reemplaza.
  const guardarPlan = async (): Promise<SesionPlan> => {
    const guardado = plan
      ? await actualizarSesion(plan.id, seleccion)
      : await crearSesion(Number(patientId), seleccion);
    setPlan(guardado);
    return guardado;
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setExito("");
    setServerError("");
    try {
      await guardarPlan();
      setExito("Plan guardado correctamente");
    } catch (error) {
      setServerError(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const handleIniciar = async () => {
    setGuardando(true);
    setExito("");
    setServerError("");
    try {
      // Si hay cambios sin guardar (o todavía no hay plan) se guardan antes de empezar.
      const sesion = hayCambios || !plan ? await guardarPlan() : plan;
      await iniciarSesion(sesion.id);
      navigate(`/sesiones/${sesion.id}/ejercicios/${sesion.ejercicioIds[0]}`, {
        state: { queue: sesion.ejercicioIds, index: 0, from: "nueva-sesion" },
      });
    } catch (error) {
      setServerError(mensajeDeError(error));
      setGuardando(false);
    }
  };

  if (cargaFallida) {
    return <Alert severity="error">{cargaFallida}</Alert>;
  }
  if (!paciente) {
    return <div>Cargando...</div>;
  }

  const nombre = `${paciente.nombre} ${paciente.apellido}`;

  return (
    <>
      <BackButton to={`/pacientes/${patientId}/informacion`}>
        Volver a {nombre}
      </BackButton>
      <Box>
        <Stack direction="row" spacing={0.5} className="items-center">
          <Typography variant="h4" component="h1">
            {plan ? "Plan de la sesión" : "Elegí los ejercicios"}
          </Typography>
          <Tooltip title="Guardar plan" arrow>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={!hayCambios || seleccion.length === 0 || guardando}
                onClick={handleGuardar}
              >
                <SaveOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Typography variant="body1" color="text.secondary" className="mt-1">
          Seleccioná los ejercicios que realizará {nombre} durante la sesión
        </Typography>
      </Box>
      {exito && (
        <Alert severity="success" onClose={() => setExito("")}>
          {exito}
        </Alert>
      )}
      {serverError && <Alert severity="error">{serverError}</Alert>}
      <TypeFilterChips value={type} onChange={cambiarTipo} />
      <Grid container spacing={3}>
        {sesionEjercicio.map((ejercicio) => {
          const elegido = seleccion.includes(ejercicio.id);
          return (
            <Grid key={ejercicio.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Tooltip title={ejercicio.descripcion ?? ""} arrow placement="top">
                <Card
                  className="h-full"
                  sx={{
                    border: 1,
                    borderColor: elegido ? "primary.main" : "divider",
                    bgcolor: "background.paper",
                    p: 0.6,
                  }}
                >
                  <CardActionArea
                    className="h-full"
                    sx={{ p: 2.5, cursor: "pointer" }}
                    onClick={() => alternar(ejercicio.id)}
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
                        checked={elegido}
                        sx={{ pointerEvents: "none" }}
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
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          className="flex-1"
        />
        <Typography variant="body2" color="text.secondary">
          {seleccion.length === 1
            ? "1 ejercicio seleccionado"
            : `${seleccion.length} ejercicios seleccionados`}
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          disabled={seleccion.length === 0 || guardando}
          onClick={handleIniciar}
        >
          Iniciar Sesión
        </Button>
      </Stack>
    </>
  );
}
