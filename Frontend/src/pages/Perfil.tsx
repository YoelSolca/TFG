import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, Divider, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import SaveIcon from "@mui/icons-material/Save";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import axios from "axios";
import dayjs from "dayjs";
import { PageHeader, PersonAvatar, SectionHeader } from "../components/common";
import PasswordField from "../components/passwordField";
import { useAuth } from "../App";
import { actualizarPerfil, cambiarContrasenia, obtenerPerfil } from "../actions/psicopedagogo.action";
import { PerfilPsicopedagogo } from "../Model/psicopedagogo.model";
import { validarContrasenia } from "../utils/contrasenia";
import { isEmail, validarDocumento, validarTelefono } from "../utils/validaciones";

// En la base el género se guarda como una letra.
const GENEROS = [
  { valor: "F", etiqueta: "Femenino" },
  { valor: "M", etiqueta: "Masculino" },
  { valor: "O", etiqueta: "Otro" },
];

type Campo = "nombre" | "apellido" | "documento" | "telefono" | "genero" | "fechaNacimiento" | "correoElectronico" | "actual" | "nueva";

const aFormulario = (p: PerfilPsicopedagogo) => ({
  nombre: p.nombre,
  apellido: p.apellido,
  documento: p.documento,
  telefono: p.telefono,
  genero: p.genero ?? "",
  fechaNacimiento: p.fechaNacimiento ?? "",
  correoElectronico: p.correoElectronico,
});

export default function Perfil() {
  const { user, signIn } = useAuth();
  const [perfil, setPerfil] = useState<PerfilPsicopedagogo | null>(null);
  const [cargaFallida, setCargaFallida] = useState(false);
  const [form, setForm] = useState(aFormulario({ nombre: "", apellido: "", documento: "", telefono: "", genero: "", fechaNacimiento: "", correoElectronico: "" } as PerfilPsicopedagogo));
  const [pw, setPw] = useState({ actual: "", nueva: "" });
  const [errors, setErrors] = useState<Partial<Record<Campo, string>>>({});
  const [serverError, setServerError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerPerfil()
      .then((p) => {
        setPerfil(p);
        setForm(aFormulario(p));
      })
      .catch(() => setCargaFallida(true));
  }, []);

  const limpiarAvisos = (campo?: Campo) => {
    if (campo) setErrors((er) => ({ ...er, [campo]: undefined }));
    setServerError("");
    setExito("");
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    limpiarAvisos(k);
  };
  const field = (k: keyof typeof form) => ({ value: form[k], onChange: set(k), error: Boolean(errors[k]), helperText: errors[k], fullWidth: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfil) return;

    const correo = form.correoElectronico.trim().toLowerCase();
    const cambioCorreo = correo !== perfil.correoElectronico.toLowerCase();

    const er: Partial<Record<Campo, string>> = {};
    if (!form.nombre.trim()) er.nombre = "Requerido";
    if (!form.apellido.trim()) er.apellido = "Requerido";
    const errDocumento = validarDocumento(form.documento);
    if (errDocumento) er.documento = errDocumento;
    const errTelefono = validarTelefono(form.telefono);
    if (errTelefono) er.telefono = errTelefono;
    if (!form.genero) er.genero = "Requerido";
    if (!form.fechaNacimiento) er.fechaNacimiento = "Requerido";
    if (!isEmail(correo)) er.correoElectronico = "Correo electrónico inválido";

    if (pw.nueva) {
      const errNueva = validarContrasenia(pw.nueva);
      if (errNueva) er.nueva = errNueva;
    }
    if (pw.nueva && !pw.actual) er.actual = "Ingresá tu contraseña actual";
    if (pw.actual && !pw.nueva && !cambioCorreo) er.nueva = "Completá la nueva contraseña";
    if (cambioCorreo && !pw.actual) er.actual = "Para cambiar el correo ingresá tu contraseña actual";

    setErrors(er);
    setServerError("");
    setExito("");
    if (Object.keys(er).length) return;

    setGuardando(true);
    let contraseniaCambiada = false;
    try {
      // La contraseña se cambia primero: si la actual es incorrecta, no se guarda nada.
      let confirmacion = pw.actual;
      if (pw.nueva) {
        await cambiarContrasenia({ contraseniaActual: pw.actual, nuevaContrasenia: pw.nueva });
        contraseniaCambiada = true;
        confirmacion = pw.nueva; // la anterior ya no sirve para confirmar el cambio de correo
      }

      const actualizado = await actualizarPerfil({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        documento: form.documento.trim(),
        telefono: form.telefono.trim(),
        genero: form.genero,
        fechaNacimiento: form.fechaNacimiento,
        correoElectronico: correo,
        contraseniaActual: cambioCorreo ? confirmacion : undefined,
      });

      setPerfil(actualizado);
      setForm(aFormulario(actualizado));
      setPw({ actual: "", nueva: "" });
      if (user) signIn({ ...user, name: actualizado.nombre }); // el saludo del Inicio usa este nombre
      setExito("Perfil actualizado correctamente");
    } catch (error) {
      if (contraseniaCambiada) setPw({ actual: "", nueva: "" });
      mostrarError(error, contraseniaCambiada);
    } finally {
      setGuardando(false);
    }
  };

  // Los errores con código se muestran debajo del campo que corresponde; el resto, arriba del formulario.
  const mostrarError = (error: unknown, contraseniaCambiada: boolean) => {
    const datos = axios.isAxiosError(error) ? error.response?.data : undefined;
    const detalle: string | undefined = datos?.detail;
    const aviso = contraseniaCambiada ? "Tu contraseña se cambió, pero no se pudieron guardar los datos. " : "";

    switch (datos?.title) {
      case "INVALID_CREDENTIALS":
        setErrors((er) => ({ ...er, actual: detalle }));
        break;
      case "DUPLICATE_IDCARD":
        setErrors((er) => ({ ...er, documento: detalle }));
        if (aviso) setServerError(aviso);
        break;
      case "EMAIL_TAKEN":
        setErrors((er) => ({ ...er, correoElectronico: detalle }));
        if (aviso) setServerError(aviso);
        break;
      default:
        setServerError(aviso + (detalle ?? "No se pudo guardar el perfil. Intentá de nuevo."));
    }
  };

  if (cargaFallida) {
    return <Alert severity="error">No pudimos cargar tu perfil. Intentá de nuevo más tarde.</Alert>;
  }
  if (!perfil) {
    return <div>Cargando...</div>;
  }

  return (
    <Box className="w-full max-w-[800px] mx-auto flex flex-col gap-6">
      <PageHeader title="Configuración del perfil" subtitle="Gestioná la información de tu cuenta" />

      <Card className="p-6">
        <Stack direction="row" spacing={2} className="items-center">
          <PersonAvatar initials={perfil.nombre.charAt(0) + perfil.apellido.charAt(0)} size={56} colorId={perfil.personaId} />
          <Box className="flex-1">
            <Typography className="text-[20px] font-medium">{perfil.nombre} {perfil.apellido}</Typography>
            <Typography variant="body2" color="text.secondary">Lic. Psicopedagogía · {perfil.matricula}</Typography>
          </Box>
          {perfil.estado === "Aprobado" && (
            <Stack direction="row" spacing={0.5} className="items-center" sx={{ color: "success.main" }}>
              <VerifiedOutlinedIcon fontSize="small" />
              <Typography variant="body2" className="font-medium">Matrícula verificada</Typography>
            </Stack>
          )}
        </Stack>
      </Card>

      <Card component="form" noValidate onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        <SectionHeader title="Información de la cuenta" subtitle="Actualizá tus datos personales" />
        {exito && <Alert severity="success" onClose={() => setExito("")}>{exito}</Alert>}
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nombre" {...field("nombre")} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Apellido" {...field("apellido")} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Documento" {...field("documento")} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField label="Teléfono" {...field("telefono")} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select label="Género" {...field("genero")}>
              {GENEROS.map((g) => <MenuItem key={g.valor} value={g.valor}>{g.etiqueta}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DatePicker
              label="Fecha de nacimiento"
              format="DD/MM/YYYY"
              disableFuture
              value={form.fechaNacimiento ? dayjs(form.fechaNacimiento) : null}
              onChange={(d) => {
                setForm((f) => ({ ...f, fechaNacimiento: d?.isValid() ? d.format("YYYY-MM-DD") : "" }));
                limpiarAvisos("fechaNacimiento");
              }}
              slotProps={{ textField: { fullWidth: true, error: Boolean(errors.fechaNacimiento), helperText: errors.fechaNacimiento } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Matrícula profesional" value={perfil.matricula} disabled helperText="Para cambiarla contactá al administrador" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}><TextField type="email" label="Correo electrónico" {...field("correoElectronico")} /></Grid>
        </Grid>

        <Divider />
        <SectionHeader title="Cambiar contraseña (opcional)" subtitle="Completá ambos campos solo si querés cambiarla" />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PasswordField
              label="Contraseña actual"
              value={pw.actual}
              onChange={(e) => { setPw((s) => ({ ...s, actual: e.target.value })); limpiarAvisos("actual"); }}
              error={Boolean(errors.actual)}
              helperText={errors.actual ?? "También se pide si cambiás el correo"}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <PasswordField
              label="Nueva contraseña"
              value={pw.nueva}
              onChange={(e) => { setPw((s) => ({ ...s, nueva: e.target.value })); limpiarAvisos("nueva"); }}
              error={Boolean(errors.nueva)}
              helperText={errors.nueva}
            />
          </Grid>
        </Grid>

        <Stack direction="row" className="justify-end">
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
