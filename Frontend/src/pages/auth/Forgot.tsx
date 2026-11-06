import { mensajeDelServidor } from "../../utils/Errores";
import { isEmail } from "../../utils/Validaciones";
import { useState } from "react";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { solicitarRecuperacion } from "../../actions/Auth.action";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isEmail(email)) {
      setError("Ingresá un correo electrónico válido");
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      try {
        await solicitarRecuperacion(email);
        setSent(true);
      } catch (error) {
        setError(mensajeDelServidor(error, "No se pudo enviar el correo de recuperación. Intentá de nuevo."));
      } finally {
        setLoading(false);
      }
    }, 700);
  };

  if (sent) {
    return (
      <Box className="w-full max-w-[460px] mx-auto flex flex-col gap-4 items-start">
        <Box
          className="rounded-full grid place-items-center w-14 h-14"
          sx={{ bgcolor: "rgba(37, 99, 235, 0.08)", color: "primary.main" }}
        >
          <MarkEmailReadOutlinedIcon fontSize="large" />
        </Box>
        <Typography variant="h4" component="h1">
          Revisá tu correo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Si <strong>{email}</strong> está asociado a una cuenta, te enviamos un enlace para restablecer tu contraseña.
        </Typography>
        <Box className="flex gap-2 flex-wrap">
          <Button variant="contained" component={RouterLink} to="/login">
            Volver a iniciar sesión
          </Button>
          <Button onClick={() => setSent(false)}>Usar otro correo</Button>
        </Box>
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
      <Box className="text-center">
        <Typography variant="h4" component="h1">
          ¿Olvidaste tu contraseña?
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mt-1">
          Ingresá el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecerla.
        </Typography>
      </Box>
      <TextField
        fullWidth
        autoFocus
        type="email"
        label="Correo electrónico"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError("");
        }}
        error={Boolean(error)}
        helperText={error}
      />
      <Box className="flex justify-center mt-2">
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={22} color="inherit" /> : "Enviar correo electrónico"}
        </Button>
      </Box>
    </Box>
  );
}
