import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { PersonAvatar } from "./common";
import { obtenerPacientes } from "../actions/pacientes.action";
import { PacienteListItem } from "../Model/paciente.model";

// Elegir el paciente con el que se va a trabajar y seguir a la selección de ejercicios de su sesión.
export default function NuevaSesionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<PacienteListItem[]>([]);
  const [paciente, setPaciente] = useState<PacienteListItem | null>(null);
  const [texto, setTexto] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(false);

  // Cada vez que se abre arranca vacío.
  useEffect(() => {
    if (!open) return;
    setPaciente(null);
    setTexto("");
    setError(false);
  }, [open]);

  // Busca en el backend (nombre, apellido o documento) con una pequeña espera, así no se pide una vez por tecla.
  useEffect(() => {
    if (!open) return;
    let vigente = true;
    setBuscando(true);
    const timer = setTimeout(() => {
      obtenerPacientes(texto.trim(), undefined, 1, 10)
        .then((response) => {
          if (!vigente) return;
          setPacientes(response.items);
          setError(false);
        })
        .catch(() => vigente && setError(true))
        .finally(() => vigente && setBuscando(false));
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(timer);
    };
  }, [open, texto]);

  const continuar = () => {
    if (!paciente) return;
    onClose();
    navigate(`/sesiones/nueva/ejercicios/${paciente.id}`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nueva sesión</DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        <DialogContentText>
          Elegí el paciente con el que vas a trabajar y después seleccioná los ejercicios.
        </DialogContentText>
        <Autocomplete
          options={pacientes}
          value={paciente}
          onChange={(_, value) => setPaciente(value)}
          onInputChange={(_, value, reason) => {
            // Al elegir una opción el campo muestra su nombre: eso no es una búsqueda nueva.
            if (reason === "input") setTexto(value);
            if (reason === "clear") setTexto("");
          }}
          getOptionLabel={(p) => `${p.nombre} ${p.apellido}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(opciones) => opciones} // ya vienen filtrados por el backend
          loading={buscando}
          loadingText="Buscando..."
          noOptionsText={error ? "No se pudo buscar pacientes" : "No hay pacientes"}
          renderOption={({ key, ...props }, p) => (
            <Box
              key={key}
              component="li"
              {...props}
              sx={{ display: "flex !important", flexDirection: "row", alignItems: "center", gap: 1.5, py: 1 }}
            >
              <PersonAvatar initials={p.nombre.charAt(0) + p.apellido.charAt(0)} size={36} colorId={p.id} />
              <Box className="min-w-0 flex-1">
                <Typography variant="body2" noWrap className="font-medium">
                  {p.nombre} {p.apellido}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap className="block">
                  DNI {p.documento} · {p.tiposDificultad[0] ?? "Sin dificultad cargada"}
                </Typography>
              </Box>
            </Box>
          )}
          slotProps={{ listbox: { className: "max-h-[280px]" } }}
          renderInput={(params) => (
            <TextField {...params} label="Paciente" placeholder="Buscar por nombre o documento" autoFocus />
          )}
        />
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" startIcon={<PlayArrowIcon />} disabled={!paciente} onClick={continuar}>
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
