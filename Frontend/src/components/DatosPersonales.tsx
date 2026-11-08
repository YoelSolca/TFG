import { Dispatch, SetStateAction } from "react";
import { Card, Grid, IconButton, MenuItem, TextField, Tooltip } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import EditIcon from "@mui/icons-material/Edit";
import dayjs from "dayjs";
import { PacienteDetalle } from "../models/PacienteDetalle.model";
import { KeyValue, SectionHeader } from "./Common";

export default function DatosPersonales({
  paciente,
  editing,
  form,
  setForm,
  onEdit,
}: {
  paciente: PacienteDetalle;
  form: PacienteDetalle | null;
  setForm: Dispatch<SetStateAction<PacienteDetalle | null>>;
  editing: boolean;
  onEdit: () => void;
}) {
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
            <KeyValue label="DNI" value={Number(paciente.documento).toLocaleString("es-AR")} />
          </Grid>
        </Grid>

        <Grid container rowSpacing={2.5} columnSpacing={3}>
          <Grid size={4}>
            <KeyValue label="Fecha de nacimiento" value={dayjs(paciente.fechaNacimiento).format("DD/MM/YYYY")} />
          </Grid>
          <Grid size={4}>
            <KeyValue label="Genero" value={paciente.genero === "M" ? "Masculino" : "Femenino"} />
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
            onChange={(e) => form && setForm({ ...form, nombre: e.target.value })}
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label="Apellido"
            value={editing ? form?.apellido : paciente.apellido}
            onChange={(e) => form && setForm({ ...form, apellido: e.target.value })}
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            label="DNI"
            value={editing ? form?.documento : Number(paciente.documento).toLocaleString("es-AR")}
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
            value={editing ? dayjs(form?.fechaNacimiento) : dayjs(paciente.fechaNacimiento)}
            onChange={(nuevaFecha) =>
              form &&
              setForm({
                ...form,
                fechaNacimiento: nuevaFecha ? nuevaFecha.format("YYYY-MM-DD") : "",
              })
            }
          />
        </Grid>
        <Grid size={4}>
          <TextField
            fullWidth
            select
            label="Genero"
            value={editing ? form?.genero : paciente.genero}
            onChange={(e) => form && setForm({ ...form, genero: e.target.value })}
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
