import { useEffect, useState } from "react";
import { Link as RouterLink, useOutletContext, useParams } from "react-router-dom";
import { PacienteDetalle, TiposDificultad } from "../../models/PacienteDetalle.model";
import { KeyValue, SectionHeader } from "../../components/Common";
import DatosPersonales from "../../components/DatosPersonales";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import dayjs from "dayjs";
import { guardarCambiosPaciente } from "../../actions/Pacientes.action";
import { obtenerTiposDificultad } from "../../actions/TiposDificultad.action";

export default function Informacion() {
  const [form, setForm] = useState<PacienteDetalle | null>(null);
  // en Informacion.tsx o Historial.tsx
  const { paciente, setPaciente } = useOutletContext<{
    paciente: PacienteDetalle | null;
    setPaciente: React.Dispatch<React.SetStateAction<PacienteDetalle | null>>;
  }>();
  const { id } = useParams();
  const [editing, setEditing] = useState(false);
  const [catalogoDificultades, setCatalogoDificultades] = useState<TiposDificultad[]>([]);
  const [errorDificultades, setErrorDificultades] = useState("");

  useEffect(() => {
    obtenerTiposDificultad()
      .then(setCatalogoDificultades)
      .catch((error) => {
        console.error("Error al obtener los tipos de dificultad:", error);
      });
  }, []);

  const alternarDificultad = (tipo: TiposDificultad) => {
    setErrorDificultades("");
    setForm((f) => {
      if (!f) return f;
      const elegida = f.tiposDificultad.some((t) => t.id === tipo.id);
      return {
        ...f,
        tiposDificultad: elegida ? f.tiposDificultad.filter((t) => t.id !== tipo.id) : [...f.tiposDificultad, tipo],
      };
    });
  };

  async function guardarCambios() {
    if (form) {
      if (form.tiposDificultad.length === 0) {
        setErrorDificultades("Elegí al menos una dificultad");
        return;
      }
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

  const ultimaSesion = paciente.ultimaSesion;

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: "grow" }}>
          <DatosPersonales
            paciente={paciente}
            editing={editing}
            onEdit={() => {
              setEditing(true);
              setErrorDificultades("");
              setForm(paciente);
            }}
            form={form}
            setForm={setForm}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: "auto" }} className="lg:w-[400px]">
          <Card className="p-6 h-full flex flex-col gap-4">
            {ultimaSesion ? (
              <>
                <SectionHeader
                  title="Última sesión"
                  action={
                    <Button size="small" component={RouterLink} to={`/sesiones/${ultimaSesion.id}`}>
                      Ver detalles
                    </Button>
                  }
                />
                <KeyValue
                  label="Fecha"
                  value={
                    dayjs(ultimaSesion.fecha).format("DD/MM/YYYY") + " · " + dayjs(ultimaSesion.fecha).format("HH:mm")
                  }
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Actividades realizadas
                  </Typography>
                  <Stack direction="row" spacing={1} className="mt-2">
                    {ultimaSesion.tiposEjercicio.map((tipo) => (
                      <Chip key={tipo} label={tipo} size="small" color="primary" />
                    ))}
                  </Stack>
                </Box>
              </>
            ) : (
              <>
                <SectionHeader title="Última sesión" />
                <Typography variant="body2" color="text.secondary">
                  Todavía no hay sesiones con este paciente.
                </Typography>
              </>
            )}
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
              onChange={(e) => form && setForm({ ...form, objetivo: e.target.value })}
            />
            <Box>
              <Typography variant="caption" color={errorDificultades ? "error" : "text.secondary"}>
                Dificultades trabajadas
                {errorDificultades && ` · ${errorDificultades}`}
              </Typography>
              {editing ? (
                <FormGroup className="grid grid-cols-1 sm:grid-cols-2">
                  {catalogoDificultades.map((tipo) => (
                    <FormControlLabel
                      key={tipo.id}
                      control={
                        <Checkbox
                          checked={form?.tiposDificultad.some((t) => t.id === tipo.id) ?? false}
                          onChange={() => alternarDificultad(tipo)}
                        />
                      }
                      label={tipo.nombre}
                      slotProps={{ typography: { variant: "body2" } }}
                    />
                  ))}
                </FormGroup>
              ) : (
                <Stack direction="row" useFlexGap className="gap-2 flex-wrap mt-2">
                  {paciente.tiposDificultad.map((tipo) => (
                    <Chip key={tipo.id} label={tipo.nombre} color="primary" variant="outlined" />
                  ))}
                </Stack>
              )}
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
              onChange={(e) => form && setForm({ ...form, observaciones: e.target.value })}
            />

            {editing && (
              <Stack direction="row" spacing={1.5} className="justify-end">
                <Button
                  onClick={() => {
                    setErrorDificultades("");
                    setEditing(false);
                  }}
                >
                  Cancelar
                </Button>

                <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarCambios}>
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
