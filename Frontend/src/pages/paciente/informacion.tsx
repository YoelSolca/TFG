import { Dispatch, SetStateAction, useState } from "react";
import {
  Link as RouterLink,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { PacienteDetalle } from "../../Model/PacienteDetalle.model";
import { KeyValue, SectionHeader } from "../../components/common";
import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import dayjs from "dayjs";
import { guardarCambiosPaciente } from "../../actions/pacientes.action";

function DatosPersonales({
  editing,
  form,
  setForm,
  onEdit,
}: {
  form: PacienteDetalle | null;
  setForm: Dispatch<SetStateAction<PacienteDetalle | null>>;
  editing: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  // en Informacion.tsx o Historial.tsx
  const { paciente } = useOutletContext<{ paciente: PacienteDetalle }>();

  if (!editing) {
    return (
      <Card className="p-6 h-full flex flex-col gap-5">
        <SectionHeader
          title="Datos personales"
          action={
            <Tooltip title="Editar">
              <IconButton color="primary" size="small" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        ></SectionHeader>
        <Grid container rowSpacing={2.5} columnSpacing={3}>
          <Grid size={4}>
            <KeyValue label="Nombre" value={paciente.nombre} />
          </Grid>
          <Grid size={4}>
            <KeyValue label="Apellido" value={paciente.apellido} />
          </Grid>
          <Grid size={4}>
            <KeyValue
              label="DNI"
              value={Number(paciente.documento).toLocaleString("es-AR")}
            />
          </Grid>
        </Grid>

        <Grid container rowSpacing={2.5} columnSpacing={3}>
          <Grid size={4}>
            <KeyValue
              label="Fecha de nacimiento"
              value={dayjs(paciente.fechaNacimiento).format("DD/MM/YYYY")}
            />
          </Grid>
          <Grid size={4}>
            <KeyValue label="Dirección" value={paciente.direccion} />
          </Grid>
          <Grid size={4}>
            <KeyValue
              label="Genero"
              value={paciente.genero === "M" ? "Masculino" : "Femenino"}
            />
          </Grid>
        </Grid>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-full flex flex-col gap-5">
      <SectionHeader title="Datos personales" />
      <Grid container spacing={2}>
        <Grid size={4}>
          <TextField
            fullWidth
            label="Nombre"
            value={editing ? form?.nombre : paciente.nombre}
            onChange={(e) =>
              form && setForm({ ...form, nombre: e.target.value })
            }
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label="Apellido"
            value={editing ? form?.apellido : paciente.apellido}
            onChange={(e) =>
              form && setForm({ ...form, apellido: e.target.value })
            }
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label="DNI"
            value={
              editing
                ? form?.documento
                : Number(paciente.documento).toLocaleString("es-AR")
            }
            onChange={(e) => {
              const documento = e.target.value.replace(/[^\d+\s-]/g, "");
              form && setForm({ ...form, documento: documento });
            }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={4}>
          <DatePicker
            slotProps={{
              textField: { fullWidth: true },
            }}
            label="Fecha de nacimiento"
            format="DD/MM/YYYY"
            value={
              editing
                ? dayjs(form?.fechaNacimiento)
                : dayjs(paciente.fechaNacimiento)
            }
            onChange={(nuevaFecha) =>
              form &&
              setForm({
                ...form,
                fechaNacimiento: nuevaFecha
                  ? nuevaFecha.format("YYYY-MM-DD")
                  : "",
              })
            }
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label="Dirección"
            value={editing ? form?.direccion : paciente.direccion}
            onChange={(e) =>
              form && setForm({ ...form, direccion: e.target.value })
            }
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            select
            label="Genero"
            value={editing ? form?.genero : paciente.genero}
            onChange={(e) =>
              form && setForm({ ...form, genero: e.target.value })
            }
          >
            {[
              { label: "Masculino", value: "M" },
              { label: "Femenino", value: "F" },
              { label: "Otro", value: "O" },
            ].map((g) => (
              <MenuItem key={g.value} value={g.value}>
                {g.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Card>
  );
}

export default function Informacion() {
  const [form, setForm] = useState<PacienteDetalle | null>(null);
  // en Informacion.tsx o Historial.tsx
  const { paciente, setPaciente } = useOutletContext<{
    paciente: PacienteDetalle | null;
    setPaciente: React.Dispatch<React.SetStateAction<PacienteDetalle | null>>;
  }>();
  const { id } = useParams();
  const [editing, setEditing] = useState(false);


  async function guardarCambios() {
    if (form) {
      guardarCambiosPaciente(id!, form)
        .then(() => {
          setPaciente(form); // Actualiza el estado del paciente con los datos del formulario
          setEditing(false);
        })
        .catch((error) => {
          console.error("Error al actualizar paciente:", error);
        });
    }
  }

  if (!paciente) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: "grow" }}>
          <DatosPersonales
            // paciente={paciente}
            editing={editing}
            onEdit={() => {
              setEditing(true);
              setForm(paciente);
            }}
            onClose={() => setEditing(false)}
            form={form}
            setForm={setForm}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: "auto" }} className="lg:w-[400px]">
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader
              title="Última sesión"
              action={
                <Button
                  size="small"
                  component={RouterLink}
                  to={`/sesiones/${paciente.ultimaSesion.id}`}
                >
                  Ver detalles
                </Button>
              }
            />
            <KeyValue
              label="Fecha"
              value={
                dayjs(paciente.ultimaSesion.fecha).format("DD/MM/YYYY") +
                " · " +
                dayjs(paciente.ultimaSesion.fecha).format("HH:mm")
              }
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Actividades realizadas
              </Typography>
              <Stack direction="row" spacing={1} className="mt-2">
                {paciente.ultimaSesion.tiposEjercicio.map((tipo) => (
                  <Chip key={tipo} label={tipo} size="small" color="primary" />
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader title="Objetivos de intervención" />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Objetivo"
              disabled={!editing}
              value={editing ? form?.objetivo : paciente.objetivo}
              onChange={(e) =>
                form && setForm({ ...form, objetivo: e.target.value })
              }
            />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Dificultades trabajadas
              </Typography>
              <Box className="mt-2">
                {paciente.tiposDificultad.map((tipo) => (
                  <Chip
                    key={tipo.id}
                    label={tipo.nombre}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full flex flex-col gap-4">
            <SectionHeader title="Observaciones" />
            <TextField
              fullWidth
              multiline
              minRows={3}
              disabled={!editing}
              value={editing ? form?.observaciones : paciente.observaciones}
              onChange={(e) =>
                form && setForm({ ...form, observaciones: e.target.value })
              }
            />

            {editing && (
              <Stack direction="row" spacing={1.5} className="justify-end">
                <Button onClick={() => setEditing(false)}>Cancelar</Button>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={guardarCambios}
                >
                  Guardar cambios
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
