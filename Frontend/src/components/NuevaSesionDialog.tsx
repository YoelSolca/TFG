import { useNavigate } from "react-router-dom";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SelectPacienteDialog from "./SelectPacienteDialog";

// Elegir el paciente con el que se va a trabajar y seguir a la selección de ejercicios de su sesión.
export default function NuevaSesionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <SelectPacienteDialog
      open={open}
      onClose={onClose}
      title="Nueva sesión"
      description="Elegí el paciente con el que vas a trabajar y después seleccioná los ejercicios."
      icon={<PlayArrowIcon />}
      onSelect={(paciente) => navigate(`/sesiones/nueva/ejercicios/${paciente.id}`)}
    />
  );
}
