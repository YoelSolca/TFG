import { mensajeDelServidor, tieneEstado } from "../../utils/Errores";
import { useNavigate, useParams } from "react-router-dom";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import TarjetaEjercicio from "../../components/TarjetaEjercicio";
import { BackButton } from "../../components/Common";
import { Alert, Box, Button, Grid, IconButton, Pagination, Stack, Tooltip, Typography } from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { useEffect, useState } from "react";
import {
  actualizarSesion,
  crearSesion,
  iniciarSesion,
  obtenerPlanSesion,
  sesionEjercicios,
} from "../../actions/Sesion.action";
import { obtenerPacientePorId } from "../../actions/Pacientes.action";
import { PacienteDetalle } from "../../models/PacienteDetalle.model";
import { SesionPlan } from "../../models/Sesion.model";
import { TypeFilterChips } from "../paciente/Historial";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

const mismosEjercicios = (a: number[], b: number[]) => a.length === b.length && a.every((id, i) => id === b[i]);

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

  const [type, setType] = useState<string | number>("Todas");

  useEffect(() => {
    if (!patientId) return;
    Promise.all([obtenerPacientePorId(patientId), obtenerPlanSesion(patientId)])
      .then(([pacienteResponse, planResponse]) => {
        setPaciente(pacienteResponse);
        setPlan(planResponse);
        setSeleccion(planResponse?.ejercicioIds ?? []);
      })
      .catch((error) => {
        const noExiste = tieneEstado(error, 404);
        setCargaFallida(
          noExiste
            ? "No encontramos al paciente."
            : "No pudimos cargar los datos de la sesión. Intentá de nuevo más tarde.",
        );
      });
  }, [patientId]);

  const {
    items: ejercicios,
    page,
    setPage,
    totalPages,
  } = useListaPaginada(
    (p) => sesionEjercicios(type === "Todas" ? undefined : Number(type), p),
    [type],
    "Error al obtener los ejercicios:",
  );

  const alternar = (id: number) =>
    setSeleccion((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]));

  const hayCambios = plan ? !mismosEjercicios(seleccion, plan.ejercicioIds) : seleccion.length > 0;

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
      setServerError(mensajeDelServidor(error, "No se pudo guardar la sesión. Intentá de nuevo."));
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
      setServerError(mensajeDelServidor(error, "No se pudo guardar la sesión. Intentá de nuevo."));
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
      <BackButton to={`/pacientes/${patientId}/informacion`}>Volver a {nombre}</BackButton>
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
      <TypeFilterChips value={type} onChange={setType} />
      <Grid container spacing={3}>
        {ejercicios.map((ejercicio) => (
          <Grid key={ejercicio.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <TarjetaEjercicio
              ejercicio={ejercicio}
              elegido={seleccion.includes(ejercicio.id)}
              onAlternar={() => alternar(ejercicio.id)}
            />
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" useFlexGap className="gap-3 flex-wrap items-center">
        <Pagination
          page={page}
          count={totalPages}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          className="flex-1"
        />
        <Typography variant="body2" color="text.secondary">
          {seleccion.length === 1 ? "1 ejercicio seleccionado" : `${seleccion.length} ejercicios seleccionados`}
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
