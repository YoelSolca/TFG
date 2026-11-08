import { useEffect, useState } from "react";
import { Link as RouterLink, Outlet, useParams, useLocation } from "react-router-dom";
import { Box, Button, Card, Stack, Tab, Tabs, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { PacienteDetalle } from "../models/PacienteDetalle.model";
import { obtenerPacientePorId } from "../actions/Pacientes.action";
import { PersonAvatar } from "../components/Common";
import GenerarInformeDialog from "../components/GenerarInformeDialog";
import { formatearEdad } from "../utils/Edad";

const PATIENT_TABS = [
  { label: "Información", path: "informacion" },
  { label: "Historial", path: "historial" },
  { label: "Evolución", path: "evolucion" },
  { label: "Informes", path: "informes" },
];

// La pestaña activa sale de la URL y cada pestaña navega a su pantalla.
export function PatientTabs() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const activa = PATIENT_TABS.findIndex((t) => pathname.endsWith(t.path));

  return (
    <Tabs
      value={activa === -1 ? false : activa}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      {PATIENT_TABS.map((t) => (
        <Tab key={t.path} label={t.label} component={RouterLink} to={`/pacientes/${id}/${t.path}`} />
      ))}
    </Tabs>
  );
}

// Cabecera del paciente: solo muestra datos, el paciente se lo pasa el layout.
function PatientHeader({ patient, action }: { patient: PacienteDetalle; action?: React.ReactNode }) {
  return (
    <Card className="p-6">
      <Stack direction="row" useFlexGap className="gap-4 flex-wrap items-center">
        <PersonAvatar initials={patient.nombre.charAt(0) + patient.apellido.charAt(0)} size={56} colorId={patient.id} />
        <Box className="flex-1 min-w-40">
          <Typography variant="h5" component="h1">
            {patient.nombre} {patient.apellido}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatearEdad(patient.fechaNacimiento)} · DNI {Number(patient.documento).toLocaleString("es-AR")}
          </Typography>
        </Box>
        {action}
      </Stack>
    </Card>
  );
}

// Layout de las pantallas de un paciente (/pacientes/:id/...).
// Pide el paciente una sola vez y se lo reparte a las pantallas hijas con <Outlet context>.
export default function PacienteLayout() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null);
  const [generandoInforme, setGenerandoInforme] = useState(false); // diálogo "Generar informe" abierto
  const { pathname } = useLocation();
  const enInformes = pathname.endsWith("/informes");
  const enInformacion = pathname.endsWith("/informacion");

  useEffect(() => {
    obtenerPacientePorId(id!).then(setPaciente).catch(console.error);
  }, [id]);

  if (!paciente) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      {/* Como en el diseño: Información tiene "Nueva sesión", Informes tiene "Generar informe" y Historial y Evolución no tienen botón. */}
      <PatientHeader
        patient={paciente}
        action={
          enInformes ? (
            <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => setGenerandoInforme(true)}>
              Generar informe
            </Button>
          ) : enInformacion ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={RouterLink}
              to={`/sesiones/nueva/ejercicios/${paciente.id}`}
            >
              Nueva sesión
            </Button>
          ) : undefined
        }
      />

      <PatientTabs />

      <Outlet context={{ paciente, setPaciente, abrirGenerarInforme: () => setGenerandoInforme(true) }} />

      <GenerarInformeDialog
        open={generandoInforme}
        pacienteId={String(paciente.id)}
        nombrePaciente={paciente.nombre}
        onClose={() => setGenerandoInforme(false)}
      />
    </>
  );
}
