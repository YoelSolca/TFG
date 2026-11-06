import { ReactNode, useEffect, useState } from "react";
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
import { PersonAvatar } from "./Common";
import { obtenerPacientes } from "../actions/Pacientes.action";
import { PacienteListItem } from "../models/Paciente.model";

// Selector de paciente reutilizable: busca por nombre o documento y avisa cuál se eligió.
// Cada pantalla le pone el título, el texto y lo que pasa al continuar (Nueva sesión, Generar informe...).
export default function SelectPacienteDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Continuar",
  icon,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  icon?: ReactNode;
  onSelect: (paciente: PacienteListItem) => void;
}) {
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
    onSelect(paciente);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        <DialogContentText>{description}</DialogContentText>
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
        <Button variant="contained" startIcon={icon} disabled={!paciente} onClick={continuar}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
