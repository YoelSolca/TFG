import {
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  type ChipProps,
} from "@mui/material";
import { useDebounce } from "../../hooks/UseDebounce";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { KeyValue, NameCell, PageHeader, StatCard, TablePager } from "../../components/Common";
import { avisarCambioDeSolicitudes } from "../../utils/Eventos";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import BlockIcon from "@mui/icons-material/Block";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { PsicopedagogoListItem, UpdateStateRequest } from "../../models/Psicopedagogo.model";
import { listarPsicopedagogos, actualizarEstadoPsicopedagogo } from "../../actions/Psicopedagogo.action";
import UndoIcon from "@mui/icons-material/Undo";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

export const STATUS = {
  PENDING: "pendiente",
  APPROVED: "aprobado",
  REJECTED: "rechazado",
  SUSPENDED: "suspendido",
} as const;

const TABS = [
  { value: STATUS.PENDING, label: "Pendientes" },
  { value: STATUS.APPROVED, label: "Aprobadas" },
  { value: STATUS.REJECTED, label: "Rechazadas" },
  { value: STATUS.SUSPENDED, label: "Suspendidos" },
];
const CHIP: Record<string, { label: string; color: ChipProps["color"] }> = {
  [STATUS.PENDING]: { label: "Pendiente", color: "warning" },
  [STATUS.APPROVED]: { label: "Aprobada", color: "success" },
  [STATUS.REJECTED]: { label: "Rechazada", color: "error" },
  [STATUS.SUSPENDED]: { label: "Suspendida", color: "default" },
};

const toEstado = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const GENEROS: Record<string, string> = { F: "Femenino", M: "Masculino", O: "Otro" };

// El servidor manda las fechas como texto ISO ("2026-11-03T15:56:14.78"): en pantalla van como dd/mm/aaaa.
const formatearFecha = (iso: string | null) => (iso ? dayjs(iso).format("DD/MM/YYYY") : "-");

export const StatusChip = ({ status }: { status: (typeof STATUS)[keyof typeof STATUS] }) => (
  <Chip size="small" variant="outlined" {...CHIP[status]} />
);

function RejectDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: PsicopedagogoListItem | null;
  onClose: () => void;
  onConfirm: (target: PsicopedagogoListItem | null, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const close = () => {
    setReason("");
    onClose();
  };
  return (
    <Dialog open={Boolean(target)} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Rechazar solicitud</DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        <DialogContentText>
          Vas a rechazar la solicitud de <strong>{target?.nombre + " " + target?.apellido}</strong>. Podés indicar un
          motivo, que se le mostrará al intentar ingresar.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          label="Motivo (opcional)"
          placeholder="Ej: no pudimos verificar la matrícula"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={close}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onConfirm(target, reason.trim());
            setReason("");
          }}
        >
          Rechazar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DetailDialog({
  target,
  onClose,
  onApprove,
  onReject,
}: {
  target: PsicopedagogoListItem | null;
  onClose: () => void;
  onApprove: (target: PsicopedagogoListItem) => void;
  onReject: (target: PsicopedagogoListItem) => void;
}) {
  return (
    <Dialog open={Boolean(target)} onClose={onClose} maxWidth="sm" fullWidth>
      {target && (
        <>
          <DialogTitle className="flex items-center justify-between gap-2">
            Solicitud de registro <StatusChip status={target.estado} />
          </DialogTitle>
          <DialogContent className="flex flex-col gap-4">
            <NameCell nombre={target.nombre} apellido={target.apellido} />
            <Divider />
            <Grid container rowSpacing={2} columnSpacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <KeyValue label="Matrícula profesional" value={target.matricula} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <KeyValue label="Documento" value={target.documento} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <KeyValue label="Correo electrónico" value={target.correoElectronico} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <KeyValue label="Teléfono" value={target.telefono || "-"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <KeyValue label="Género" value={GENEROS[target.genero ?? ""] ?? "-"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <KeyValue label="Fecha de nacimiento" value={formatearFecha(target.fechaNacimiento)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <KeyValue label="Solicitud enviada" value={formatearFecha(target.fechaSolicitud)} />
              </Grid>
              {target.fechaAprobacion && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <KeyValue label="Aprobada el" value={formatearFecha(target.fechaAprobacion)} />
                </Grid>
              )}
              {/* Solo tiene sentido para quien ya trabajó en el sistema. */}
              {target.estado !== STATUS.PENDING && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <KeyValue label="Pacientes que atiende" value={String(target.pacientesActivos)} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <KeyValue label="Última sesión realizada" value={formatearFecha(target.ultimaActividad)} />
                  </Grid>
                </>
              )}
              {target.motivo && (
                <Grid size={12}>
                  <KeyValue
                    label={target.estado === STATUS.SUSPENDED ? "Motivo de la suspensión" : "Motivo del rechazo"}
                    value={target.motivo}
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={onClose}>Cerrar</Button>
            {target.estado === STATUS.PENDING && (
              <Button color="error" startIcon={<CloseIcon />} onClick={() => onReject(target)}>
                Rechazar
              </Button>
            )}
            {target.estado !== STATUS.APPROVED && (
              <Button variant="contained" startIcon={<CheckIcon />} onClick={() => onApprove(target)}>
                {target.estado === STATUS.SUSPENDED ? "Reactivar" : "Aprobar"}
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

export default function Solicitudes() {
  const [tab, setTab] = useState(STATUS.PENDING);
  const [detail, setDetail] = useState<PsicopedagogoListItem | null>(null);
  const [rejecting, setRejecting] = useState<PsicopedagogoListItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // se incrementa para volver a pedir los contadores
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

  const debouncedSearch = useDebounce(search);

  // La lista se pide filtrada por la pestaña activa (el backend espera "Pendiente", "Aprobado", etc.).
  const {
    items: profesionales,
    page,
    setPage,
    totalPages,
    recargar,
  } = useListaPaginada<PsicopedagogoListItem>(
    // El backend manda el estado con mayúscula ("Pendiente"); STATUS y CHIP usan minúsculas.
    (p) =>
      listarPsicopedagogos(debouncedSearch, [toEstado(tab)], p).then((data) => ({
        ...data,
        items: data.items.map((x: PsicopedagogoListItem) => ({ ...x, estado: x.estado.toLowerCase() })),
      })),
    [debouncedSearch, tab],
    "Error al obtener psicopedagogos:",
  );

  // Como la lista viene filtrada, los contadores se piden aparte (solo el total de cada estado).
  useEffect(() => {
    Promise.all(
      TABS.map((t) => listarPsicopedagogos("", [toEstado(t.value)], 1, 1).then((d) => [t.value, d.total] as const)),
    )
      .then((entries) => setCounts(Object.fromEntries(entries)))
      .catch((error) => console.error("Error al obtener los contadores:", error));
  }, [reloadKey]);

  const count = (s: string) => counts[s] ?? 0;

  const cambiarEstado = async (p: PsicopedagogoListItem, request: UpdateStateRequest) => {
    try {
      await actualizarEstadoPsicopedagogo(p.personaId, request);
      setRejecting(null);
      setDetail(null);
      recargar();
      setReloadKey((k) => k + 1);
      avisarCambioDeSolicitudes(); // el globito del menú tiene que bajar
    } catch {
      // el error ya se loguea en la action
    }
  };
  const aprobar = (p: PsicopedagogoListItem) => cambiarEstado(p, { estado: STATUS.APPROVED });
  const rechazar = (p: PsicopedagogoListItem | null, reason: string) => {
    if (p) cambiarEstado(p, { estado: STATUS.REJECTED, motivo: reason || undefined });
  };
  const volverAPendiente = (p: PsicopedagogoListItem) => cambiarEstado(p, { estado: STATUS.PENDING });

  return (
    <>
      <PageHeader
        title="Solicitudes de registro"
        subtitle="Revisá la matrícula de cada psicopedagogo antes de habilitar su acceso"
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Pendientes de revisión" value={count(STATUS.PENDING)} icon={HourglassTopIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Profesionales activos" value={count(STATUS.APPROVED)} icon={VerifiedUserOutlinedIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Profesionales suspendidos" value={count(STATUS.SUSPENDED)} icon={PersonOffOutlinedIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Solicitudes rechazadas" value={count(STATUS.REJECTED)} icon={BlockIcon} />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        {TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={`${t.label} (${count(t.value)})`} />
        ))}
      </Tabs>

      <TextField
        size="small"
        placeholder="Buscar por nombre, matrícula, correo o documento"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-[420px]"
        sx={{ bgcolor: "background.paper" }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Profesional</TableCell>
              <TableCell>Matrícula</TableCell>
              <TableCell className="hidden md:table-cell">Correo electrónico</TableCell>
              <TableCell className="hidden sm:table-cell">Solicitud</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profesionales.map((p) => (
              <TableRow key={p.personaId} hover className="cursor-pointer" onClick={() => setDetail(p)}>
                <TableCell>
                  <NameCell nombre={p.nombre} apellido={p.apellido} />
                </TableCell>
                <TableCell>{p.matricula}</TableCell>
                <TableCell className="hidden md:table-cell">{p.correoElectronico}</TableCell>

                <TableCell className="hidden sm:table-cell">
                  {" "}
                  {p.fechaSolicitud ? new Date(p.fechaSolicitud).toLocaleDateString("es-AR") : "-"}
                </TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Ver detalle">
                    <IconButton size="small" onClick={() => setDetail(p)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {p.estado !== STATUS.APPROVED && (
                    <Tooltip title={p.estado === STATUS.SUSPENDED ? "Reactivar" : "Aprobar"}>
                      <IconButton size="small" color="success" onClick={() => aprobar(p)}>
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {p.estado === STATUS.PENDING && (
                    <Tooltip title="Rechazar">
                      <IconButton size="small" color="error" onClick={() => setRejecting(p)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {p.estado === STATUS.APPROVED && (
                    <Tooltip title="Volver a pendiente">
                      <IconButton size="small" onClick={() => volverAPendiente(p)}>
                        <UndoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!profesionales.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" className="py-10">
                  <Typography color="text.secondary">
                    {search
                      ? "No hay resultados para tu búsqueda."
                      : tab === STATUS.PENDING
                        ? "No hay solicitudes pendientes. ¡Todo al día!"
                        : "No hay solicitudes en esta categoría."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePager page={page} count={totalPages} onChange={(p) => setPage(p)} />
      </TableContainer>

      <DetailDialog target={detail} onClose={() => setDetail(null)} onApprove={aprobar} onReject={setRejecting} />
      <RejectDialog target={rejecting} onClose={() => setRejecting(null)} onConfirm={rechazar} />
    </>
  );
}
