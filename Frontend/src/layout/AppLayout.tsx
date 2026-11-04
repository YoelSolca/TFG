import { useEffect, useState } from "react";
import {
  Link as RouterLink,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import brainIcon from "../assets/icons/logo.png";
import HowToRegIcon from '@mui/icons-material/HowToReg';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { ROLES, useAuth } from "../App";
import { ListPsicopedagogos } from "../actions/psicopedagogo.action";
export const DRAWER_WIDTH = 260;

type NavItem = {
  label: string;
  to: string;
  icon: typeof HomeIcon;
  match: (p: string) => boolean;
  badge?: boolean;
};

const NAV: NavItem[] = [
  { label: "Inicio", to: "/", icon: HomeIcon, match: (p: string) => p === "/" },
  {
    label: "Pacientes",
    to: "/pacientes",
    icon: PeopleIcon,
    match: (p: string) => p.startsWith("/pacientes"),
  },
  {
    label: "Sesiones",
    to: "/sesiones",
    icon: EventIcon,
    match: (p: string) =>
      p.startsWith("/sesiones") && !p.includes("/ejercicios/"),
  },
  {
    label: "Ejercicios realizados",
    to: "/ejercicios",
    icon: AssignmentIcon,
    match: (p: string) => p.startsWith("/ejercicios"),
  },
  {
    label: "Informes",
    to: "/informes",
    icon: DescriptionIcon,
    match: (p: string) => p.startsWith("/informes"),
  },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Solicitudes', to: '/admin', icon: HowToRegIcon, match: (p:string) => p === '/admin', badge: true },
  { label: 'Profesionales', to: '/admin/profesionales', icon: VerifiedUserOutlinedIcon, match: (p:string) => p.startsWith('/admin/profesionales') },
];

function SideNav({
  mobile,
  open,
  onClose,
}: {
  mobile?: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  const { pathname, state } = useLocation();
  const locked = Array.isArray(state?.queue);
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const nav = isAdmin ? ADMIN_NAV : NAV;
  const [pending, setPending] = useState(0);

  // Cantidad de solicitudes pendientes para el badge; se refresca al navegar.
  useEffect(() => {
    if (!isAdmin) return;
    ListPsicopedagogos("", ["Pendiente"], 1, 1)
      .then((data: { total: number }) => setPending(data.total))
      .catch(() => setPending(0));
  }, [isAdmin, pathname]);

  return (
    <Drawer
      variant={mobile ? "temporary" : "permanent"}
      open={mobile ? open : true}
      onClose={onClose}
      className="no-print"
      sx={{
        width: 260,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 260,
          bgcolor: "primary.main",
          color: "white",
          border: 0,
          px: 2,
          pt: 3,
          pb: 2,
        },
      }}
    >
      <Stack direction="row" useFlexGap className="items-center pl-3 mb-16">
        <Box component="img" src={brainIcon} alt="Logo" className="w-10 h-10" />
      </Stack>

      <List disablePadding className="flex flex-col gap-1">
        {nav.map(({ label, to, icon: Icon, match, badge }) => {
          const selected = match(pathname);
          return (
            <ListItemButton
              key={to}
              component={locked ? "div" : NavLink}
              to={locked ? undefined : to}
              disabled={locked}
              selected={selected}
              className="rounded-lg py-3"
              sx={{
                color: selected ? "common.white" : "rgba(255,255,255,0.8)",
                "&.Mui-selected, &.Mui-selected:hover": {
                  bgcolor: "rgba(255,255,255,0.16)",
                },
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                "&.Mui-disabled": { color: "rgba(255,255,255,0.4)" },
              }}
            >
              <ListItemIcon
                className="min-w-10"
                sx={{
                  color: selected ? "common.white" : "rgba(255,255,255,0.72)",
                }}
              >
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={label}
                slotProps={{
                  primary: {
                    className: selected
                      ? "text-[15px] font-medium"
                      : "text-[15px] font-normal",
                  },
                }}
              />
              {badge && pending > 0 && <Badge badgeContent={pending} color="error" className="mr-2" />}
            </ListItemButton>
          );
        })}
      </List>

      <Box className="flex-1" />
      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
      <Stack
        direction="row"
        spacing={1.5}
        className="items-center px-3 pt-4 pb-2"
      >
        <Avatar
          className="text-[16px] font-medium"
          sx={{ bgcolor: "common.white", color: "primary.main" }}
        >
          {"PM"}
        </Avatar>
        <Box>
          <Typography variant="body2" className="font-medium">
            {"Pia"} {"Martinez"}
          </Typography>
          <Typography variant="caption" className="opacity-72">
            {"Lic. Psicopedagogía"}
          </Typography>
        </Box>
      </Stack>
    </Drawer>
  );
}

export default function AppLayout() {
  const theme = useTheme();

  // Detecta si la pantalla es de tamaño móvil utilizando el hook useMediaQuery y el tema de Material-UI.
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const { pathname, state } = useLocation();
  const locked = Array.isArray(state?.queue);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <Box className="flex min-h-screen" sx={{ bgcolor: "background.default" }}>
      <SideNav mobile={mobile} open={open} onClose={() => setOpen(false)} />
      <Box className="flex-1 min-w-0">
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          className="no-print"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar className="min-h-16 justify-end gap-2">
            {locked ? (
              <Stack
                direction="row"
                spacing={1}
                className="items-center mr-auto"
                sx={{ color: "text.secondary" }}
              >
                <LockOutlinedIcon fontSize="small" />
                <Typography variant="body2">
                  Sesión en curso — completá los ejercicios para continuar
                </Typography>
              </Stack>
            ) : (
              <>
                {mobile && (
                  <IconButton
                    edge="start"
                    aria-label="Abrir menú"
                    onClick={() => setOpen(true)}
                    className="mr-auto"
                  >
                    <MenuIcon />
                  </IconButton>
                )}
                <Button
                  startIcon={<PersonIcon />}
                  component={RouterLink}
                  to="/perfil"
                >
                  Perfil
                </Button>
                <Tooltip title="Cerrar sesión">
                  <IconButton aria-label="Cerrar sesión">
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          className="flex flex-col gap-6 px-4 md:px-10 pt-6 md:pt-8 pb-10"
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
