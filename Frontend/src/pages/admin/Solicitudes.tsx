import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, InputAdornment, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography, type ChipProps } from "@mui/material";
import { useEffect, useState } from "react";
import { IconBox, KeyValue, PageHeader, PersonAvatar, TablePager } from "../../components/common";
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import BlockIcon from '@mui/icons-material/Block';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { PsicopedagogoListItem, UpdateStateRequest } from "../../Model/psicopedagogo.model";
import { ListPsicopedagogos, UpdatePsicopedagogoState } from "../../actions/psicopedagogo.action";
import UndoIcon from '@mui/icons-material/Undo';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export const STATUS = { PENDING: 'pendiente', APPROVED: 'aprobado', REJECTED: 'rechazado', SUSPENDED: 'suspendido' } as const;

const TABS = [
  { value: STATUS.PENDING, label: 'Pendientes' },
  { value: STATUS.APPROVED, label: 'Aprobadas' },
  { value: STATUS.REJECTED, label: 'Rechazadas' },
  { value: STATUS.SUSPENDED, label: 'Suspendidos' },
];
const CHIP: Record<string, { label: string; color: ChipProps['color'] }> = {
  [STATUS.PENDING]: { label: 'Pendiente', color: 'warning' },
  [STATUS.APPROVED]: { label: 'Aprobada', color: 'success' },
  [STATUS.REJECTED]: { label: 'Rechazada', color: 'error' },
  [STATUS.SUSPENDED]: { label: 'Suspendida', color: 'default' },
};

const toEstado = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const StatusChip = ({ status }: { status: typeof STATUS[keyof typeof STATUS] }) => <Chip size="small" variant="outlined" {...CHIP[status]} />;



function RejectDialog({target, onClose, onConfirm}: {target: PsicopedagogoListItem | null, onClose: () => void, onConfirm: (target: PsicopedagogoListItem | null, reason: string) => void}) {
  const [reason, setReason] = useState('');
  const close = () => { setReason(''); onClose(); };
  return (
    <Dialog open={Boolean(target)} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle>Rechazar solicitud</DialogTitle>
      <DialogContent className="flex flex-col gap-4">
        <DialogContentText>
          Vas a rechazar la solicitud de <strong>{target?.nombre + " " + target?.apellido}</strong>. Podés indicar un motivo, que se le mostrará al intentar ingresar.
        </DialogContentText>
        <TextField autoFocus fullWidth multiline minRows={2} label="Motivo (opcional)" placeholder="Ej: no pudimos verificar la matrícula" value={reason} onChange={(e) => setReason(e.target.value)} />
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={close}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={() => { onConfirm(target, reason.trim()); setReason(''); }}>Rechazar</Button>
      </DialogActions>
    </Dialog>
  );
}

function DetailDialog({ target, onClose, onApprove, onReject } : { target: PsicopedagogoListItem | null, onClose: () => void, onApprove: (target: PsicopedagogoListItem) => void, onReject: (target: PsicopedagogoListItem) => void }) {
  return (
    <Dialog open={Boolean(target)} onClose={onClose} maxWidth="sm" fullWidth>
      {target && (
        <>
          <DialogTitle className="flex items-center justify-between gap-2">
            Solicitud de registro <StatusChip status={target.estado} />
          </DialogTitle>
          <DialogContent className="flex flex-col gap-4">
            <NameCell initials={target.nombre.charAt(0) + target.apellido.charAt(0)} name={target.nombre + " " + target.apellido} />
            <Divider />
            <Grid container rowSpacing={2} columnSpacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}><KeyValue label="Matrícula profesional" value={target.matricula} /></Grid>
              {/* <Grid size={{ xs: 12, sm: 6 }}><KeyValue label="Documento" value={target.Documento} /></Grid> */}
              <Grid size={{ xs: 12, sm: 6 }}><KeyValue label="Correo electrónico" value={target.correoElectronico} /></Grid>
              {/* <Grid size={{ xs: 12, sm: 6 }}><KeyValue label="Teléfono" value={target.phone} /></Grid> */}
              {/* <Grid size={{ xs: 12, sm: 6 }}><KeyValue label="Género" value={target.gender} /></Grid> */}
              {/* <Grid size={{ xs: 12, sm: 6 }}><KeyValue label="Fecha de nacimiento" value={formatDate(target.birthDate)} /></Grid> */}
              <Grid size={{ xs: 12, sm: 6 }}><KeyValue label="Solicitud enviada" value={target.fechaSolicitud} /></Grid>
              {/* {target.rejectionReason && <Grid size={12}><KeyValue label="Motivo del rechazo" value={target.rejectionReason} /></Grid>} */}
              {/* {target.suspensionReason && <Grid size={12}><KeyValue label="Motivo de la suspensión" value={target.suspensionReason} /></Grid>} */}
            </Grid>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={onClose}>Cerrar</Button>
            {target.estado === STATUS.PENDING && (
              <Button color="error" startIcon={<CloseIcon />} onClick={() => onReject(target)}>Rechazar</Button>
            )}
            {target.estado !== STATUS.APPROVED && (
              <Button variant="contained" startIcon={<CheckIcon />} onClick={() => onApprove(target)}>{target.estado === STATUS.SUSPENDED ? 'Reactivar' : 'Aprobar'}</Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: typeof HourglassTopIcon }) {
  return (
    <Card className="p-5 h-full">
      <Stack direction="row" spacing={2} className="items-center">
        <IconBox icon={icon} size={48} />
        <Box>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography className="text-[28px] font-semibold leading-9">{value}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}



function NameCell({ initials, name }: { initials: string; name: string }) {
  return (
    <Stack direction="row" spacing={1.5} className="items-center">
      <PersonAvatar initials={initials} size={32} />
      <Typography variant="body2" className="font-medium">{name}</Typography>
    </Stack>
  );
}

export default function Solicitudes() {
  const [professionals, setProfesionals] = useState< PsicopedagogoListItem[]>([]);
  
//   const toast = useToast();
  const [tab, setTab] = useState(STATUS.PENDING);
  const [detail, setDetail] = useState<PsicopedagogoListItem | null>(null);
  const [rejecting, setRejecting] = useState<PsicopedagogoListItem | null>(null);
  const [reloadKey, setReloadKey] = useState(0); // se incrementa para volver a pedir lista y contadores
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
 const [page, setPage] = useState(1); // la página que se está viendo
  const [totalPages, setTotalPages] = useState(1);


  useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(search), 300);
      return () => clearTimeout(timer);
    }, [search]);

  // La lista se pide filtrada por la pestaña activa (el backend espera "Pendiente", "Aprobado", etc.).
  useEffect(() => {
    ListPsicopedagogos(debouncedSearch, [toEstado(tab)], page)
    .then((data) => {
        // El backend manda el estado con mayúscula ("Pendiente"); STATUS y CHIP usan minúsculas.
        setProfesionals(data.items.map((p: PsicopedagogoListItem) => ({ ...p, estado: p.estado.toLowerCase() })));
        setTotalPages(Math.max(1, Math.ceil(data.total / data.pageSize)));
      })
    .catch((error) => {
        console.error("Error al obtener psicopedagogos:", error);
      });
    }, [debouncedSearch, tab, page, reloadKey]);

  // Como la lista viene filtrada, los contadores se piden aparte (solo el total de cada estado).
  useEffect(() => {
    Promise.all(TABS.map((t) => ListPsicopedagogos("", [toEstado(t.value)], 1, 1).then((d) => [t.value, d.total] as const)))
      .then((entries) => setCounts(Object.fromEntries(entries)))
      .catch((error) => console.error("Error al obtener los contadores:", error));
    }, [reloadKey]);

    const count = (s: string) => counts[s] ?? 0;

  const changeState = async (p: PsicopedagogoListItem, request: UpdateStateRequest) => {
    try {
      await UpdatePsicopedagogoState(p.personaId, request);
      setRejecting(null);
      setDetail(null);
      setReloadKey((k) => k + 1);
    } catch {
      // el error ya se loguea en la action
    }
  };
  const handleApprove = (p: PsicopedagogoListItem) => changeState(p, { estado: STATUS.APPROVED });
  const handleReject = (p: PsicopedagogoListItem | null, reason: string) => {
    if (p) changeState(p, { estado: STATUS.REJECTED, motivo: reason || undefined });
  };
  const handlePending = (p: PsicopedagogoListItem) => changeState(p, { estado: STATUS.PENDING });


  return(
    <>
      <PageHeader title="Solicitudes de registro" subtitle="Revisá la matrícula de cada psicopedagogo antes de habilitar su acceso" />
     <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Pendientes de revisión" value={count(STATUS.PENDING)} icon={HourglassTopIcon} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Profesionales activos" value={count(STATUS.APPROVED)} icon={VerifiedUserOutlinedIcon} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Profesionales suspendidos" value={count(STATUS.SUSPENDED)} icon={PersonOffOutlinedIcon} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard label="Solicitudes rechazadas" value={count(STATUS.REJECTED)} icon={BlockIcon} /></Grid>
    </Grid> 
    
    <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); }} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((t) => <Tab key={t.value} value={t.value} label={`${t.label} (${count(t.value)})`} />)}
    </Tabs>

     <TextField
        size="small" placeholder="Buscar por nombre, matrícula, correo o documento" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full sm:w-[420px]" sx={{ bgcolor: 'background.paper' }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
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
            {professionals.map((p) => (
              <TableRow key={p.personaId} hover className="cursor-pointer" onClick={() => setDetail(p)}>
                <TableCell><NameCell initials={p.nombre.charAt(0) + p.apellido.charAt(0)} name={p.nombre + ' ' + p.apellido} /></TableCell>
                <TableCell>{p.matricula}</TableCell>
                <TableCell className="hidden md:table-cell">{p.correoElectronico}</TableCell>

                <TableCell className="hidden sm:table-cell">  {p.fechaSolicitud ? new Date(p.fechaSolicitud).toLocaleDateString("es-AR") : "-"}</TableCell>
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Ver detalle"><IconButton size="small" onClick={() => setDetail(p)}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                  {p.estado !== STATUS.APPROVED && (
                    <Tooltip title={p.estado === STATUS.SUSPENDED ? 'Reactivar' : 'Aprobar'}><IconButton size="small" color="success" onClick={() => handleApprove(p)}><CheckIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {p.estado === STATUS.PENDING && (
                    <Tooltip title="Rechazar"><IconButton size="small" color="error" onClick={() => setRejecting(p)}><CloseIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                  {p.estado === STATUS.APPROVED && (
                    <Tooltip title="Volver a pendiente"><IconButton size="small" onClick={() => handlePending(p)}><UndoIcon fontSize="small" /></IconButton></Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!professionals.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" className="py-10">
                  <Typography color="text.secondary">
                    {search ? 'No hay resultados para tu búsqueda.' : tab === STATUS.PENDING ? 'No hay solicitudes pendientes. ¡Todo al día!' : 'No hay solicitudes en esta categoría.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePager
          page={page}
          count={totalPages}
          onChange={(p) => setPage(p)}
        />
      </TableContainer>

      <DetailDialog target={detail} onClose={() => setDetail(null)} onApprove={handleApprove} onReject={setRejecting} />
      <RejectDialog target={rejecting} onClose={() => setRejecting(null)} onConfirm={handleReject} />
    </>
  )
}
