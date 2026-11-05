import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Card, Chip, Divider, Grid, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DescriptionIcon from "@mui/icons-material/Description";
import dayjs from "dayjs";
import { useAuth } from "../App";
import { IconBox, PageHeader, PersonAvatar, SectionHeader } from "../components/common";
import { obtenerPacientes } from "../actions/pacientes.action";
import { obtenerEjerciciosRealizados, obtenerSesiones } from "../actions/sesion.action";
import { obtenerInformes } from "../actions/informe.action";
import { EjercicioRealizadoResponse, InformeResponse, SesionResponse } from "../Model/sesion.model";
import { formatearCuando, formatearDiaHora } from "../utils/tiempo";
import { periodoInforme } from "../utils/periodo";

const itemTextProps = { primary: { className: "text-[15px] font-medium" }, secondary: { variant: "body2" as const } };

const saludo = () => {
  const h = new Date().getHours();
  return h < 6 ? "Buenas noches" : h < 13 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
};

const iniciales = (nombre: string, apellido: string) => nombre.charAt(0) + apellido.charAt(0);

// "Dificultades de atención" -> "Atención"
const area = (nombre: string) => {
  const corto = nombre.replace(/^Dificultades?\s+(de|en)\s+/i, "");
  return corto.charAt(0).toUpperCase() + corto.slice(1);
};

function StatCard({ label, value, icon }: { label: string; value?: number; icon: React.ElementType }) {
  return (
    <Card className="p-5 h-full">
      <Stack direction="row" spacing={2} className="items-center">
        <IconBox icon={icon} size={48} />
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography className="text-[28px] font-semibold leading-9">{value ?? "-"}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export default function Inicio() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<number>();
  const [sesiones, setSesiones] = useState<SesionResponse>();
  const [ejercicios, setEjercicios] = useState<EjercicioRealizadoResponse>();
  const [informes, setInformes] = useState<InformeResponse>();

  // Cada bloque pide lo suyo en paralelo: la lista de 3 y el total salen de la misma respuesta.
  useEffect(() => {
    obtenerPacientes("", undefined, 1, 1).then((r) => setPacientes(r.total)).catch(console.error);
    obtenerSesiones(1, "", undefined, "Finalizada").then(setSesiones).catch(console.error);
    obtenerEjerciciosRealizados(1, "", undefined, undefined, 3).then(setEjercicios).catch(console.error);
    obtenerInformes(1, "", undefined, 3).then(setInformes).catch(console.error);
  }, []);

  const hoy = dayjs().locale("es").format("dddd, D [de] MMMM [de] YYYY");

  return (
    <>
      <PageHeader
        title={`¡${saludo()}, ${user?.name.split(" ")[0]}!`}
        subtitle={hoy.charAt(0).toUpperCase() + hoy.slice(1)}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Pacientes activos" value={pacientes} icon={PeopleIcon} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Sesiones realizadas" value={sesiones?.total} icon={EventIcon} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Ejercicios realizados" value={ejercicios?.total} icon={AssignmentIcon} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Informes generados" value={informes?.total} icon={DescriptionIcon} /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full">
            <SectionHeader title="Sesiones recientes" action={<Button size="small" component={RouterLink} to="/sesiones">Ver todas</Button>} />
            <List disablePadding>
              {sesiones?.items.map((s) => (
                <ListItem
                  key={s.id}
                  disableGutters
                  secondaryAction={s.areas.length > 0 && <Chip label={s.areas.map(area).join(" · ")} size="small" variant="outlined" />}
                >
                  <ListItemAvatar><PersonAvatar initials={iniciales(s.nombre, s.apellido)} colorId={s.pacienteId} /></ListItemAvatar>
                  <ListItemText primary={`${s.nombre} ${s.apellido}`} secondary={formatearDiaHora(s.fecha)} slotProps={itemTextProps} />
                </ListItem>
              ))}
            </List>
            {sesiones?.items.length === 0 && <Typography color="text.secondary" className="py-6 text-center">No hay sesiones para mostrar.</Typography>}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="p-6 h-full">
            <SectionHeader title="Ejercicios recientes" action={<Button size="small" component={RouterLink} to="/ejercicios">Ver todos</Button>} />
            <List disablePadding>
              {ejercicios?.items.map((e) => (
                <ListItem
                  key={`${e.sesionId}-${e.ejercicioId}`}
                  disableGutters
                  secondaryAction={<Typography variant="caption" color="text.secondary">{formatearCuando(e.fecha)}</Typography>}
                >
                  <ListItemAvatar><PersonAvatar initials={iniciales(e.nombre, e.apellido)} colorId={e.pacienteId} /></ListItemAvatar>
                  <ListItemText
                    primary={`${e.nombre} ${e.apellido}`}
                    secondary={`Completó ejercicio de ${e.tipoEjercicio.toLowerCase()}`}
                    slotProps={itemTextProps}
                  />
                </ListItem>
              ))}
            </List>
            {ejercicios?.items.length === 0 && <Typography color="text.secondary" className="py-6 text-center">No hay ejercicios para mostrar.</Typography>}
          </Card>
        </Grid>
      </Grid>

      <Card className="p-6">
        <SectionHeader title="Informes recientes" action={<Button size="small" component={RouterLink} to="/informes">Ver todos</Button>} />
        <List disablePadding>
          {informes?.items.map((r, i) => (
            <Box key={r.id}>
              {i > 0 && <Divider component="li" />}
              <ListItem disableGutters className="gap-2 md:gap-6 flex-col md:flex-row items-start md:items-center">
                <Stack direction="row" className="items-center md:w-[320px] shrink-0">
                  <ListItemAvatar><PersonAvatar initials={iniciales(r.nombre, r.apellido)} colorId={r.pacienteId} /></ListItemAvatar>
                  <ListItemText
                    primary={`${r.nombre} ${r.apellido}`}
                    secondary={`${dayjs(r.fechaGeneracion).format("DD/MM/YYYY")} · ${periodoInforme(r.periodoDesde, r.periodoHasta)}`}
                    slotProps={itemTextProps}
                  />
                </Stack>
                <Typography variant="body2">{r.resumen}</Typography>
              </ListItem>
            </Box>
          ))}
        </List>
        {informes?.items.length === 0 && <Typography color="text.secondary" className="py-6 text-center">No hay informes para mostrar.</Typography>}
      </Card>
    </>
  );
}
