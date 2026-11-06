import { useState } from "react";
import { useDebounce } from "../../hooks/UseDebounce";
import { useListaPaginada } from "../../hooks/UseListaPaginada";
import { listarPsicopedagogos, actualizarEstadoPsicopedagogo } from "../../actions/Psicopedagogo.action";
import { PsicopedagogoListItem } from "../../models/Psicopedagogo.model";
import { NameCell, PageHeader, TablePager } from "../../components/Common";
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { STATUS, StatusChip } from "./Solicitudes";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SearchIcon from "@mui/icons-material/Search";
import BlockIcon from "@mui/icons-material/Block";

export default function Profesionales() {
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<PsicopedagogoListItem | null>(null); // profesional elegido para suspender o reactivar
  const [reason, setReason] = useState(""); // motivo que escribe el admin al suspender

  // true: el diálogo va a reactivar una cuenta suspendida; false: va a suspender una aprobada.
  const reactivando = target?.estado === STATUS.SUSPENDED;

  const abrirDialogo = (p: PsicopedagogoListItem) => {
    setReason("");
    setTarget(p);
  };

  const debouncedSearch = useDebounce(search);

  const {
    items: profesionales,
    page,
    setPage,
    totalPages,
    recargar,
  } = useListaPaginada<PsicopedagogoListItem>(
    // El backend manda el estado con mayúscula ("Aprobado"); STATUS y CHIP usan minúsculas.
    (p) =>
      listarPsicopedagogos(debouncedSearch, ["Aprobado", "Suspendido"], p).then((data) => ({
        ...data,
        items: data.items.map((x: PsicopedagogoListItem) => ({ ...x, estado: x.estado.toLowerCase() })),
      })),
    [debouncedSearch],
    "Error al obtener psicopedagogos:",
  );

  const confirmarAccion = async () => {
    if (!target) return;
    try {
      await actualizarEstadoPsicopedagogo(
        target.personaId,
        reactivando ? { estado: STATUS.APPROVED } : { estado: STATUS.SUSPENDED, motivo: reason.trim() || undefined },
      );
      setTarget(null);
      recargar();
    } catch {
      // el error ya se loguea en la action
    }
  };

  return (
    <>
      <PageHeader title="Profesionales" subtitle="Psicopedagogos registrados en la plataforma" />

      <TextField
        size="small"
        placeholder="Buscar por nombre, matrícula o correo"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-[360px]"
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
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {profesionales.map((p) => (
              <TableRow key={p.personaId} hover>
                <TableCell>
                  <NameCell nombre={p.nombre} apellido={p.apellido} />{" "}
                </TableCell>
                <TableCell>{p.matricula}</TableCell>
                <TableCell className="hidden md:table-cell">{p.correoElectronico}</TableCell>
                <TableCell>
                  <StatusChip status={p.estado} />
                </TableCell>
                <TableCell align="right">
                  {p.estado === STATUS.APPROVED ? (
                    <Button size="small" color="error" startIcon={<BlockIcon />} onClick={() => abrirDialogo(p)}>
                      Suspender
                    </Button>
                  ) : (
                    <Button size="small" startIcon={<LockOpenIcon />} onClick={() => abrirDialogo(p)}>
                      Reactivar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!profesionales.length && (
              <TableRow>
                <TableCell colSpan={5} align="center" className="py-10">
                  <Typography color="text.secondary">No hay profesionales para mostrar.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePager page={page} count={totalPages} onChange={(p) => setPage(p)} />
      </TableContainer>

      <Dialog open={Boolean(target)} onClose={() => setTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{reactivando ? "¿Reactivar cuenta?" : "¿Suspender cuenta?"}</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          <DialogContentText>
            {target?.nombre} {target?.apellido}{" "}
            {reactivando
              ? "va a poder volver a ingresar a la plataforma."
              : "no va a poder ingresar a la plataforma hasta que reactives su cuenta."}
            {!reactivando && target && (
              <>
                {" "}
                Atiende a {target.pacientesActivos} {target.pacientesActivos === 1 ? "paciente" : "pacientes"}: sus
                datos se conservan, y nadie más podrá verlos mientras la cuenta esté suspendida.
              </>
            )}
          </DialogContentText>
          {!reactivando && (
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={2}
              label="Motivo (opcional)"
              placeholder="Ej: matrícula vencida"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={() => setTarget(null)}>Cancelar</Button>
          <Button variant="contained" color={reactivando ? "primary" : "error"} onClick={confirmarAccion}>
            {reactivando ? "Reactivar" : "Suspender"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
