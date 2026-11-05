import { useEffect, useState } from "react";
import { ListPsicopedagogos, UpdatePsicopedagogoState } from "../../actions/psicopedagogo.action";
import { PsicopedagogoListItem } from "../../Model/psicopedagogo.model";
import { PageHeader, PersonAvatar, TablePager } from "../../components/common";
import { Button, Card, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { STATUS, StatusChip } from "./Solicitudes";
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';

function NameCell({ initials, name }: { initials: string; name: string }) {
  return (
    <Stack direction="row" spacing={1.5} className="items-center">
      <PersonAvatar initials={initials} size={32} />
      <Typography variant="body2" className="font-medium">{name}</Typography>
    </Stack>
  );
}
export default function Profesionales() {
  const [professionals, setProfesionals] = useState< PsicopedagogoListItem[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1); // la página que se está viendo
  const [totalPages, setTotalPages] = useState(1);
  const [target, setTarget] = useState<PsicopedagogoListItem | null>(null); // profesional elegido para suspender o reactivar
  const [reason, setReason] = useState(""); // motivo que escribe el admin al suspender
  const [reloadKey, setReloadKey] = useState(0); // se incrementa para volver a pedir la lista

  // true: el diálogo va a reactivar una cuenta suspendida; false: va a suspender una aprobada.
  const reactivating = target?.estado === STATUS.SUSPENDED;

  const openDialog = (p: PsicopedagogoListItem) => { setReason(""); setTarget(p); };

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
      }, [search]);
  
    // La lista se pide filtrada por la pestaña activa (el backend espera "Pendiente", "Aprobado", etc.).
    useEffect(() => {
      ListPsicopedagogos(debouncedSearch, ["Aprobado", "Suspendido"])
      .then((data) => {
          // El backend manda el estado con mayúscula ("Pendiente"); STATUS y CHIP usan minúsculas.
          setProfesionals(data.items.map((p: PsicopedagogoListItem) => ({ ...p, estado: p.estado.toLowerCase() })));
          setTotalPages(Math.max(1, Math.ceil(data.total / data.pageSize)));
        })
      .catch((error) => {
          console.error("Error al obtener psicopedagogos:", error);
        });
      }, [debouncedSearch, page, reloadKey]);




  const confirmAction = async () => {
    if (!target) return;
    try {
      await UpdatePsicopedagogoState(
        target.personaId,
        reactivating
          ? { estado: STATUS.APPROVED }
          : { estado: STATUS.SUSPENDED, motivo: reason.trim() || undefined }
      );
      setTarget(null);
      setReloadKey((k) => k + 1);
    } catch {
      // el error ya se loguea en la action
    }
  };

return (
    <>
      <PageHeader title="Profesionales" subtitle="Psicopedagogos registrados en la plataforma" />

      <TextField
        size="small" placeholder="Buscar por nombre, matrícula o correo" value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-[360px]" sx={{ bgcolor: 'background.paper' }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
      />

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Profesional</TableCell>
              <TableCell>Matrícula</TableCell>
              <TableCell className="hidden md:table-cell">Correo electrónico</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {professionals.map((p) => (
              <TableRow key={p.personaId} hover>
                <TableCell><NameCell initials={p.nombre.charAt(0) + p.apellido.charAt(0)} name={p.nombre + " " + p.apellido}/> </TableCell>
                <TableCell>{p.matricula}</TableCell>
                <TableCell className="hidden md:table-cell">{p.correoElectronico}</TableCell>
                <TableCell><StatusChip status={p.estado} /></TableCell>
                <TableCell align="right">
                  {p.estado === STATUS.APPROVED ? (
                    <Button size="small" color="error" startIcon={<BlockIcon />} onClick={() => openDialog(p)}>Suspender</Button>
                  ) : (
                    <Button size="small" startIcon={<LockOpenIcon />} onClick={() => openDialog(p)}>Reactivar</Button>
                  )}
                </TableCell>
                
              </TableRow>
            ))}
            {!professionals.length && (
              <TableRow><TableCell colSpan={5} align="center" className="py-10"><Typography color="text.secondary">No hay profesionales para mostrar.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      <TablePager
            page={page}
            count={totalPages}
            onChange={(p) => setPage(p)}
      />
      </TableContainer>

      <Dialog open={Boolean(target)} onClose={() => setTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{reactivating ? '¿Reactivar cuenta?' : '¿Suspender cuenta?'}</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          <DialogContentText>
            {target?.nombre} {target?.apellido}{' '}
            {reactivating
              ? 'va a poder volver a ingresar a la plataforma.'
              : 'no va a poder ingresar a la plataforma hasta que reactives su cuenta.'}
          </DialogContentText>
          {!reactivating && (
            <TextField
              autoFocus fullWidth multiline minRows={2} label="Motivo (opcional)" placeholder="Ej: matrícula vencida"
              value={reason} onChange={(e) => setReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setTarget(null)}>Cancelar</Button>
          <Button variant="contained" color={reactivating ? 'primary' : 'error'} onClick={confirmAction}>
            {reactivating ? 'Reactivar' : 'Suspender'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
