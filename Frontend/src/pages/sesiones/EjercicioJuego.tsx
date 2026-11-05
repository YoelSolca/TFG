import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Card, Stack, Typography } from "@mui/material";
import { guardarResultado } from "../../actions/sesion.action";
import { JUEGOS } from "../juegos";
import { ResultadoJuego } from "../juegos/tipos";

function Juego() {
  const { id, ejercicioId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendiente, setPendiente] = useState<ResultadoJuego | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // La cola de ejercicios de la sesión y en cuál va: viaja de pantalla en pantalla.
  const queue: number[] | undefined = location.state?.queue;
  const index: number = location.state?.index ?? 0;
  const JuegoDelEjercicio = JUEGOS[Number(ejercicioId)];

  const guardar = async (resultado: ResultadoJuego) => {
    setPendiente(resultado);
    setGuardando(true);
    setError("");
    try {
      // Las métricas propias del juego (movimientos, pistas) todavía no se guardan: falta traducir su nombre al id del catálogo.
      await guardarResultado(id!, ejercicioId!, { ...resultado, observaciones: null, metricas: [] });
      navigate(`/sesiones/${id}/ejercicios/${ejercicioId}/resultado`, {
        state: { queue, index, resultadoJuego: resultado },
      });
    } catch {
      setError("No se pudo guardar el resultado.");
      setGuardando(false);
    }
  };

  if (!JuegoDelEjercicio) {
    const hayOtro = queue !== undefined && index < queue.length - 1;
    return (
      <Card className="p-6 max-w-[560px] mx-auto">
        <Stack className="gap-3 items-start">
          <Typography variant="h5">Este ejercicio todavía no tiene juego</Typography>
          <Typography color="text.secondary">
            Por ahora no se puede jugar desde la sesión.
          </Typography>
          <Button
            variant="contained"
            onClick={() =>
              hayOtro
                ? navigate(`/sesiones/${id}/ejercicios/${queue[index + 1]}`, {
                    state: { queue, index: index + 1 },
                  })
                : navigate(`/sesiones/${id}`)
            }
          >
            {hayOtro ? "Continuar con el siguiente" : "Volver a la sesión"}
          </Button>
        </Stack>
      </Card>
    );
  }

  if (pendiente) {
    return (
      <Stack className="gap-3 items-center py-12">
        {error ? (
          <>
            <Alert severity="error">{error}</Alert>
            <Button variant="contained" disabled={guardando} onClick={() => guardar(pendiente)}>
              Reintentar
            </Button>
          </>
        ) : (
          <Typography color="text.secondary">Guardando el resultado...</Typography>
        )}
      </Stack>
    );
  }

  return <JuegoDelEjercicio onFinish={guardar} />;
}

// El key reinicia el estado cuando se pasa de un ejercicio al siguiente (mismo componente, otra ruta).
export default function EjercicioJuego() {
  const { ejercicioId } = useParams();
  return <Juego key={ejercicioId} />;
}
