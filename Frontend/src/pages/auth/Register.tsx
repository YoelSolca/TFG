import { mensajeDelServidor } from "../../utils/Errores";
import { isEmail } from "../../utils/Validaciones";
import { useState } from "react";
import { CreatePsicopedagogoRequest } from "../../models/Psicopedagogo.model";
import { calcularEdad } from "../../utils/Edad";
import { validarContrasenia } from "../../utils/Contrasenia";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { Link as RouterLink } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import PasswordField from "../../components/PasswordField";
import { register } from "../../actions/Psicopedagogo.action";

const validateStep1 = (f: CreatePsicopedagogoRequest) => {
  const e: Partial<CreatePsicopedagogoRequest> = {};
  if (!f.nombre.trim()) e.nombre = "Requerido";
  if (!f.apellido.trim()) e.apellido = "Requerido";
  if (!/^\d{6,9}$/.test(f.documento.trim())) e.documento = "Ingresá solo números (6 a 9 dígitos)";
  if (!/^\d{8,13}$/.test(f.telefono.replace(/[\s-]/g, ""))) e.telefono = "Teléfono inválido";
  if (!f.genero) e.genero = "Requerido";
  if (!f.fechaNacimiento) e.fechaNacimiento = "Ingresá una fecha válida (DD/MM/AAAA)";
  else if ((calcularEdad(f.fechaNacimiento) ?? 0) < 18) e.fechaNacimiento = "Debés ser mayor de edad";
  if (!f.matricula.trim()) e.matricula = "Ingresá tu matrícula profesional";
  return e;
};

const validateStep2 = (f: CreatePsicopedagogoRequest) => {
  const e: Partial<CreatePsicopedagogoRequest> = {};
  if (!isEmail(f.correoElectronico)) e.correoElectronico = "Correo electrónico inválido";
  const errContrasenia = validarContrasenia(f.contrasenia);
  if (errContrasenia) e.contrasenia = errContrasenia;
  if (f.contrasenia2 !== f.contrasenia) e.contrasenia2 = "Las contraseñas no coinciden";
  if (!f.aceptoTerminos) e.aceptoTerminos = "Tenés que aceptar los términos y condiciones";
  return e;
};

function StepBar({ step }: { step: number }) {
  const items = ["Paso 1 · Datos personales", "Paso 2 · Datos de la cuenta"];
  return (
    <Box className="grid grid-cols-2 gap-4">
      {items.map((label, i) => {
        const active = i <= step;
        return (
          <Box key={label}>
            <Box
              className="h-[3px] rounded-full"
              sx={{ bgcolor: active ? "primary.main" : "rgba(37, 99, 235, 0.2)" }}
            />
            <Typography
              variant="caption"
              className="block mt-2 font-medium"
              sx={{ color: active ? "primary.main" : "text.secondary" }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreatePsicopedagogoRequest>({
    correoElectronico: "",
    contrasenia: "",
    nombre: "",
    apellido: "",
    telefono: "",
    documento: "",
    matricula: "",
    genero: "",
    fechaNacimiento: "",
    aceptoTerminos: "",
  });
  const [errors, setErrors] = useState<Partial<CreatePsicopedagogoRequest>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set =
    (k: keyof CreatePsicopedagogoRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target;

      let value: string | boolean = target.value;

      if (target instanceof HTMLInputElement && target.type === "checkbox") {
        value = target.checked;
      }

      setForm((f) => ({ ...f, [k]: value }));
      setErrors((er) => ({ ...er, [k]: undefined }));
      setServerError("");
    };

  const field = (k: keyof CreatePsicopedagogoRequest) => ({
    value: form[k],
    onChange: set(k),
    error: Boolean(errors[k]),
    helperText: errors[k],
    fullWidth: true,
  });

  const next = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er = validateStep1(form);
    setErrors(er);
    if (!Object.keys(er).length) setStep(1);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er = validateStep2(form);
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    setTimeout(async () => {
      try {
        await register(form);
        setLoading(false);
        setDone(true);
      } catch (error) {
        setLoading(false);
        setServerError(mensajeDelServidor(error, "No se pudo enviar la solicitud. Intentá de nuevo."));
      }
    }, 700);
  };

  if (done) {
    return (
      <Box className="w-full max-w-[460px] mx-auto flex flex-col gap-4 items-start">
        <Box
          className="rounded-full grid place-items-center w-14 h-14"
          sx={{ bgcolor: "rgba(237, 108, 2, 0.1)", color: "warning.main" }}
        >
          <HourglassTopIcon fontSize="large" />
        </Box>
        <Typography variant="h4" component="h1">
          ¡Solicitud enviada!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gracias, {form.nombre}. Un administrador va a verificar tu matrícula profesional (
          <strong>{form.matricula}</strong>) antes de habilitar tu cuenta. Cuando sea aprobada vas a poder ingresar con{" "}
          <strong>{form.correoElectronico}</strong>.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/login">
          Ir a iniciar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box className="w-full max-w-[560px] mx-auto flex flex-col gap-5">
      <Box className="text-center">
        <Typography variant="h4" component="h1">
          Registrarse
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mt-1">
          Creá tu cuenta profesional
        </Typography>
      </Box>
      <StepBar step={step} />

      {step === 0 ? (
        <Box component="form" noValidate onSubmit={next} className="flex flex-col gap-4">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Nombre (*)" autoFocus {...field("nombre")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Apellido (*)" {...field("apellido")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Documento (*)"
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
                {...field("documento")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Teléfono (*)" slotProps={{ htmlInput: { inputMode: "tel" } }} {...field("telefono")} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Género (*)"
                {...field("genero")}
                slotProps={{
                  select: { displayEmpty: true },
                  inputLabel: { shrink: true },
                }}
              >
                <MenuItem value="">Seleccione</MenuItem>
                {["Femenino", "Masculino", "Otro"].map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Fecha de nacimiento (*)"
                format="DD/MM/YYYY"
                disableFuture
                maxDate={dayjs().subtract(18, "year")}
                value={form.fechaNacimiento ? dayjs(form.fechaNacimiento) : null}
                onChange={(d) => {
                  setForm((f) => ({ ...f, fechaNacimiento: d?.isValid() ? d.format("YYYY-MM-DD") : "" }));
                  // Una fecha a medio escribir (por ejemplo solo día y mes) no es válida: se avisa en el momento y no al apretar "Continuar".
                  setErrors((er) => ({
                    ...er,
                    fechaNacimiento: d && !d.isValid() ? "Ingresá una fecha válida (DD/MM/AAAA)" : undefined,
                  }));
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.fechaNacimiento),
                    helperText: errors.fechaNacimiento,
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField label="Matrícula profesional (*)" placeholder="Ej: MP 1234" {...field("matricula")} />
            </Grid>
          </Grid>
          <Box className="flex justify-center">
            <Button type="submit" variant="contained">
              Continuar
            </Button>
          </Box>
        </Box>
      ) : (
        <Box component="form" noValidate onSubmit={submit} className="flex flex-col gap-4">
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <TextField type="email" label="Correo electrónico" autoFocus {...field("correoElectronico")} />
          <PasswordField label="Contraseña" {...field("contrasenia")} />
          <PasswordField label="Repetir contraseña" {...field("contrasenia2")} />
          <FormControl error={Boolean(errors.aceptoTerminos)}>
            <FormControlLabel
              control={<Checkbox checked={Boolean(form.aceptoTerminos)} onChange={set("aceptoTerminos")} />}
              label="Acepto los términos y condiciones"
            />
            {errors.aceptoTerminos && <FormHelperText>{errors.aceptoTerminos}</FormHelperText>}
          </FormControl>
          <Stack direction="row" spacing={2} className="justify-center">
            <Button color="inherit" onClick={() => setStep(0)} disabled={loading} sx={{ color: "text.secondary" }}>
              Volver
            </Button>
            <Button type="submit" variant="contained" disabled={loading} className="min-w-[160px]">
              {loading ? <CircularProgress size={22} color="inherit" /> : "Enviar solicitud"}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" className="text-center">
            Tu cuenta será revisada por un administrador antes de poder ingresar.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
