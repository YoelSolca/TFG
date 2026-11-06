import { mensajeDelServidor } from "../../utils/Errores";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { restablecerContrasenia } from "../../actions/Auth.action";
import PasswordField from "../../components/PasswordField";
import { REQUISITOS_CONTRASENIA, validarContrasenia } from "../../utils/Contrasenia";

export default function Reset() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [form, setForm] = useState({ password: "", password2: "" });
  const [errors, setErrors] = useState({ password: "", password2: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: "password" | "password2") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: "" }));
    setServerError("");
  };
  const field = (k: "password" | "password2") => ({
    value: form[k],
    onChange: set(k),
    error: Boolean(errors[k]),
    helperText: errors[k],
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const er = { password: "", password2: "" };
    er.password = validarContrasenia(form.password);
    if (form.password2 !== form.password) er.password2 = "Las contraseñas no coinciden";
    setErrors(er);
    if (er.password || er.password2) return;

    setLoading(true);
    setTimeout(async () => {
      try {
        await restablecerContrasenia(token, form.password);
        setLoading(false);
        setDone(true);
      } catch (error) {
        setLoading(false);
        setServerError(mensajeDelServidor(error, "No se pudo restablecer la contraseña. Intentá de nuevo."));
      }
    }, 700);
  };

  if (!token) {
    return (
      <Box className="w-full max-w-[460px] mx-auto flex flex-col gap-4 items-start">
        <Box
          className="rounded-full grid place-items-center w-14 h-14"
          sx={{ bgcolor: "rgba(211, 47, 47, 0.08)", color: "error.main" }}
        >
          <LinkOffIcon fontSize="large" />
        </Box>
        <Typography variant="h4" component="h1">
          Enlace inválido
        </Typography>
        <Typography variant="body1" color="text.secondary">
          El enlace para restablecer la contraseña está incompleto. Pedí uno nuevo para continuar.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/recuperar">
          Solicitar un nuevo enlace
        </Button>
      </Box>
    );
  }

  if (done) {
    return (
      <Box className="w-full max-w-[460px] mx-auto flex flex-col gap-4 items-start">
        <Box
          className="rounded-full grid place-items-center w-14 h-14"
          sx={{ bgcolor: "rgba(46, 125, 50, 0.08)", color: "success.main" }}
        >
          <CheckCircleOutlinedIcon fontSize="large" />
        </Box>
        <Typography variant="h4" component="h1">
          Contraseña actualizada
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ya podés iniciar sesión con tu nueva contraseña.
        </Typography>
        <Button variant="contained" component={RouterLink} to="/login">
          Ir a iniciar sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit}
      className="w-full max-w-[460px] mx-auto flex flex-col gap-4"
    >
      <Box>
        <Typography variant="h4" component="h1">
          Nueva contraseña
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mt-1">
          Elegí una contraseña nueva para tu cuenta. {REQUISITOS_CONTRASENIA}.
        </Typography>
      </Box>
      {serverError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/recuperar">
              Pedir otro enlace
            </Button>
          }
        >
          {serverError}
        </Alert>
      )}
      <PasswordField autoFocus label="Nueva contraseña" autoComplete="new-password" {...field("password")} />
      <PasswordField label="Repetir contraseña" autoComplete="new-password" {...field("password2")} />
      <Box className="flex justify-center mt-2">
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={22} color="inherit" /> : "Guardar contraseña"}
        </Button>
      </Box>
    </Box>
  );
}
