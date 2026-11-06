import { Box, Button, Card, Typography } from "@mui/material";
import brainIcon from "../assets/icons/logo.png";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";

const PANEL = {
  login: {
    text: "¿Todavía no tenés cuenta? Registrate para comenzar a planificar tus terapias.",
    cta: "Crear una cuenta",
    to: "/registro",
  },
  other: {
    text: "¿Ya tenés una cuenta? Ingresá con tus credenciales para continuar planificando tus terapias.",
    cta: "Ingresar",
    to: "/login",
  },
};
export default function AuthLayout() {
  const { pathname } = useLocation();
  const panel = pathname.startsWith("/login") ? PANEL.login : PANEL.other;

  return (
    <Box className="min-h-screen flex items-center justify-center p-4 md:p-8" sx={{ bgcolor: "background.default" }}>
      <Card
        className="w-full max-w-[1100px] flex flex-col md:flex-row overflow-hidden"
        sx={{ boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08)" }}
      >
        <Box
          className="md:w-[40%] shrink-0 flex flex-col items-center justify-center text-center gap-4 px-8 py-8 md:py-16"
          sx={{ bgcolor: "primary.main", color: "common.white" }}
        >
          <Box className="flex items-end justify-center gap-3 pr-15">
            <Box component="img" src={brainIcon} className="w-13 h-13 shrink-0 object-contain" />
            <Typography variant="h4" component="p" className="font-semibold">
              ¡Hola!
            </Typography>
          </Box>
          <Typography variant="body2" className="max-w-[280px] opacity-90">
            {panel.text}
          </Typography>
          <Button
            component={RouterLink}
            to={panel.to}
            variant="outlined"
            className="font-bold uppercase tracking-[0.3px]"
            sx={{
              color: "common.white",
              borderColor: "rgba(255,255,255,0.8)",
              "&:hover": {
                borderColor: "common.white",
                bgcolor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            {panel.cta}
          </Button>
        </Box>
        <Box className="flex-1 px-6 md:px-12 py-10 md:py-16 flex flex-col justify-center min-h-[560px]">
          <Outlet />
        </Box>
      </Card>
    </Box>
  );
}
