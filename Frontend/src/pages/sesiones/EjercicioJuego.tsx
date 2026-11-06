import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Stack, Typography } from "@mui/material";
import { JUEGOS } from "../ejercicios/Index";
import { ResultadoJuego } from "../ejercicios/Tipos";

function Juego() {
  const { id, ejercicioId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // La cola de ejercicios de la sesión y en cuál va: viaja de pantalla en pantalla.
  const queue: number[] | undefined = location.state?.queue;
  const index: number = location.state?.index ?? 0;
  const JuegoDelEjercicio = JUEGOS[Number(ejercicioId)];

  // Al terminar el juego todavía no se guarda nada: el resultado viaja a la pantalla siguiente, donde el
  // profesional escribe la observación y recién ahí, con "Guardar y continuar", se guarda todo junto.
  const terminar = (resultado: ResultadoJuego) => {
    navigate(`/sesiones/${id}/ejercicios/${ejercicioId}/resultado`, {
      state: { queue, index, resultadoJuego: resultado },
    });
  };

  if (!JuegoDelEjercicio) {
    const hayOtro = queue !== undefined && index < queue.length - 1;
    return (
      <Card className="p-6 max-w-[560px] mx-auto">
        <Stack className="gap-3 items-start">
          <Typography variant="h5">Este ejercicio todavía no tiene juego</Typography>
          <Typography color="text.secondary">Por ahora no se puede jugar desde la sesión.</Typography>
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

  return <JuegoDelEjercicio onFinish={terminar} />;
}

// El key reinicia el estado cuando se pasa de un ejercicio al siguiente (mismo componente, otra ruta).
export default function EjercicioJuego() {
  const { ejercicioId } = useParams();
  return <Juego key={ejercicioId} />;
}
