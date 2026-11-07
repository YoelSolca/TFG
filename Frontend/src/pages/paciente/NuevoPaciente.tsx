import { mensajeDelServidor, tieneEstado } from "../../utils/Errores";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { crearPaciente } from "../../actions/Pacientes.action";
import { obtenerTiposDificultad } from "../../actions/TiposDificultad.action";
import { BackButton, PageHeader, SectionHeader } from "../../components/Common";
import { TipoDificultad } from "../../models/Paciente.model";
import { validarDocumento } from "../../utils/Validaciones";

// ───────────── Parte A: formulario, validaciones y guardado ─────────────

// Largos máximos: son los mismos que valida el servidor y los que tiene la base.
const LIMITES = { nombre: 100, apellido: 100, documento: 20, objetivo: 500, observaciones: 1000 };

interface Formulario {
  nombre: string;
  apellido: string;
  documento: string;
  genero: string; // "M", "F" u "O"
  fechaNacimiento: Dayjs | null;
  objetivo: string;
  observaciones: string;
  tiposDificultadIds: number[];
}

const VACIO: Formulario = {
  nombre: "",
  apellido: "",
  documento: "",
  genero: "",
  fechaNacimiento: null,
  objetivo: "",
  observaciones: "",
  tiposDificultadIds: [],
};

type Errores = Partial<Record<keyof Formulario, string>>;

// Cada campo con problema recibe su mensaje; si el objeto vuelve vacío, el formulario está bien.
function validar(f: Formulario): Errores {
  const errores: Errores = {};
  if (!f.nombre.trim()) errores.nombre = "Requerido";
  if (!f.apellido.trim()) errores.apellido = "Requerido";
  const errorDocumento = validarDocumento(f.documento);
  if (errorDocumento) errores.documento = errorDocumento;
  if (!f.genero) errores.genero = "Requerido";
  if (!f.fechaNacimiento?.isValid()) errores.fechaNacimiento = "Requerido";
  else if (f.fechaNacimiento.isAfter(dayjs(), "day")) errores.fechaNacimiento = "La fecha no puede ser futura";
  if (f.tiposDificultadIds.length === 0) errores.tiposDificultadIds = "Elegí al menos un tipo de dificultad";
  return errores;
}

export default function NuevoPaciente() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Formulario>(VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [vinculadoId, setVinculadoId] = useState<number | null>(null); // paciente que ya existía y se agregó a la lista

  // Cambia un campo y borra su error: el mensaje desaparece apenas la persona vuelve a escribir.
  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setErrorServidor("");
  };

  const alternarDificultad = (id: number) =>
    cambiar(
      "tiposDificultadIds",
      form.tiposDificultadIds.includes(id)
        ? form.tiposDificultadIds.filter((x) => x !== id)
        : [...form.tiposDificultadIds, id],
    );

  // ───────────── Parte C: el catálogo de dificultades sale del servidor ─────────────

  const [catalogo, setCatalogo] = useState<TipoDificultad[]>([]);
  const [errorCatalogo, setErrorCatalogo] = useState(false);

  useEffect(() => {
    let vigente = true; // si la pantalla se cierra antes de que llegue la respuesta, se descarta
    obtenerTiposDificultad()
      .then((tipos) => vigente && setCatalogo(tipos))
      .catch(() => vigente && setErrorCatalogo(true));
    return () => {
      vigente = false;
    };
  }, []);

  // ───────────── Parte B: lo que comparten los campos de texto ─────────────

  // Props de un campo de texto: su valor, el cambio, el error y el largo máximo.
  const campo = (nombre: "nombre" | "apellido" | "documento") => ({
    fullWidth: true,
    value: form[nombre],
    onChange: (e: ChangeEvent<HTMLInputElement>) => cambiar(nombre, e.target.value),
    error: Boolean(errores[nombre]),
    helperText: errores[nombre],
    slotProps: { htmlInput: { maxLength: LIMITES[nombre] } },
  });

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validar(form);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setGuardando(true);
    setErrorServidor("");
    try {
      const { paciente, creado } = await crearPaciente({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        documento: form.documento.trim(),
        genero: form.genero,
        fechaNacimiento: form.fechaNacimiento!.format("YYYY-MM-DD"),
        objetivo: form.objetivo.trim() || null,
        observaciones: form.observaciones.trim() || null,
        tiposDificultadIds: form.tiposDificultadIds,
      });

      if (creado) navigate(`/pacientes/${paciente.personaId}/informacion`);
      else setVinculadoId(paciente.personaId); // ya existía: se avisa en pantalla en vez de saltar a la ficha
    } catch (error) {
      const mensaje = mensajeDelServidor(error, "No pudimos registrar al paciente. Intentá de nuevo.");
      // 409: el documento ya está registrado (en tu lista, o es de otra persona que no es paciente).
      if (tieneEstado(error, 409)) setErrores({ documento: mensaje });
      else setErrorServidor(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // ───────────── Parte A: pantalla (las columnas se agregan en las partes B y C) ─────────────

  return (
    <>
      <BackButton to="/pacientes">Volver a pacientes</BackButton>
      <PageHeader title="Nuevo paciente" subtitle="Completá los datos básicos para registrar un nuevo paciente" />

      {vinculadoId !== null && (
        <Alert
          severity="success"
          action={
            <Button color="inherit" size="small" component={RouterLink} to={`/pacientes/${vinculadoId}/informacion`}>
              Ir a la ficha
            </Button>
          }
        >
          Este paciente ya estaba registrado en el sistema y lo agregamos a tu lista.
        </Alert>
      )}
      {errorServidor && <Alert severity="error">{errorServidor}</Alert>}

      <Card component="form" noValidate onSubmit={guardar} className="p-6 flex flex-col gap-6">
        <Grid container spacing={6}>
          {/* Parte B: columna "Datos personales" */}
          <Grid size={{ xs: 12, md: 6 }} className="flex flex-col gap-6">
            <SectionHeader title="Datos personales" />
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField label="Nombre" {...campo("nombre")} />
              </Grid>
              <Grid size={6}>
                <TextField label="Apellido" {...campo("apellido")} />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="Documento"
                  {...campo("documento")}
                  slotProps={{ htmlInput: { maxLength: LIMITES.documento, inputMode: "numeric" } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  select
                  fullWidth
                  label="Género"
                  value={form.genero}
                  onChange={(e) => cambiar("genero", e.target.value)}
                  error={Boolean(errores.genero)}
                  helperText={errores.genero}
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
              <Grid size={12}>
                <DatePicker
                  label="Fecha de nacimiento"
                  value={form.fechaNacimiento}
                  onChange={(fecha) => cambiar("fechaNacimiento", fecha)}
                  maxDate={dayjs()}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(errores.fechaNacimiento),
                      helperText: errores.fechaNacimiento,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Parte C: columna de objetivos y dificultades */}
          <Grid size={{ xs: 12, md: 6 }} className="flex flex-col gap-4">
            <SectionHeader title="Objetivos de la intervención" />
            <Typography
              variant="body2"
              color={errores.tiposDificultadIds ? "error" : "text.secondary"}
              className="font-medium"
            >
              Tipo de dificultades {errores.tiposDificultadIds && `· ${errores.tiposDificultadIds}`}
            </Typography>
            {errorCatalogo ? (
              <Alert severity="error">
                No pudimos cargar los tipos de dificultad. Recargá la página para intentar de nuevo.
              </Alert>
            ) : (
              <FormGroup className="grid grid-cols-2">
                {catalogo.map((tipo) => (
                  <FormControlLabel
                    key={tipo.id}
                    control={
                      <Checkbox
                        checked={form.tiposDificultadIds.includes(tipo.id)}
                        onChange={() => alternarDificultad(tipo.id)}
                      />
                    }
                    label={tipo.nombre}
                    slotProps={{ typography: { variant: "body2" } }}
                  />
                ))}
              </FormGroup>
            )}
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Objetivos de la intervención"
              value={form.objetivo}
              onChange={(e) => cambiar("objetivo", e.target.value)}
              helperText={`${form.objetivo.length}/${LIMITES.objetivo}`}
              slotProps={{ htmlInput: { maxLength: LIMITES.objetivo } }}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Observaciones adicionales"
              value={form.observaciones}
              onChange={(e) => cambiar("observaciones", e.target.value)}
              helperText={`${form.observaciones.length}/${LIMITES.observaciones}`}
              slotProps={{ htmlInput: { maxLength: LIMITES.observaciones } }}
            />
          </Grid>
        </Grid>

        {/* Parte C: botones */}
        <Divider />
        <Stack direction="row" spacing={1.5} className="justify-end">
          <Button variant="outlined" component={RouterLink} to="/pacientes">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={guardando || vinculadoId !== null}
          >
            {guardando ? "Guardando..." : "Guardar paciente"}
          </Button>
        </Stack>
      </Card>
    </>
  );
}
