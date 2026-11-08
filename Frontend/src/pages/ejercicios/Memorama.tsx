import { useEffect, useRef, useState } from "react";
import { mezclar } from "../../utils/Mezclar";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CargarImagenes, { Banco } from "./CargarImagenes";
import { JuegoProps } from "./Tipos";

// 15 parejas = 30 cartas.
const PAREJAS = 15;
const CONSIGNA = "Da vuelta las cartas y encontrá las parejas iguales";

// Cada pareja usa un dibujo de un personaje distinto (las imágenes de memorama las genera scripts/generar-personajes.mjs).

interface Carta {
  id: number;
  url: string;
}

// Un dibujo por personaje, repetido dos veces, y todo mezclado.
function crearMazo(banco: Banco): Carta[] {
  const dibujos = mezclar(Object.values(banco))
    .slice(0, PAREJAS)
    .map((lista) => lista[Math.floor(Math.random() * lista.length)]);
  return mezclar([...dibujos, ...dibujos]).map((url, id) => ({ id, url }));
}

// Las dos caras de la carta ocupan el mismo lugar; la que no mira al frente se oculta.
const cara = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: 3,
  backfaceVisibility: "hidden",
} as const;

const dibujo = {
  position: "absolute",
  top: 6,
  left: 6,
  width: "calc(100% - 12px)",
  height: "calc(100% - 12px)",
  objectFit: "contain",
} as const;

// Primero se descarga la lista de imágenes y recién entonces arranca el juego.
export default function Memorama(props: JuegoProps) {
  return <CargarImagenes juego="memorama">{(banco) => <Juego {...props} banco={banco} />}</CargarImagenes>;
}

function Juego({ onFinish, banco }: JuegoProps & { banco: Banco }) {
  const [mazo] = useState(() => crearMazo(banco));
  const [volteadas, setVolteadas] = useState<number[]>([]);
  const [encontradas, setEncontradas] = useState<string[]>([]);
  const [bloqueado, setBloqueado] = useState(false);
  const [mensaje, setMensaje] = useState<"" | "bien" | "casi">("");
  const [terminado, setTerminado] = useState(false);

  // Lo que se guarda va en refs: los timers leen siempre el valor actual.
  const aciertos = useRef(0);
  const errores = useRef(0);
  const movimientos = useRef(0);
  const inicio = useRef(Date.now());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pendientes = timers;
    return () => {
      pendientes.current.forEach(clearTimeout);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const parejas = mazo.length / 2;

  const resultado = () => ({
    aciertos: aciertos.current,
    errores: errores.current,
    tiempoSegundos: Math.round((Date.now() - inicio.current) / 1000),
    metricas: [{ nombre: "movimientos", valor: movimientos.current }],
  });

  const voltear = (carta: Carta) => {
    if (bloqueado || terminado || volteadas.includes(carta.id) || encontradas.includes(carta.url)) return;

    const arriba = [...volteadas, carta.id];
    setVolteadas(arriba);
    if (arriba.length < 2) return;

    // Cada par de cartas dadas vuelta es un movimiento.
    movimientos.current += 1;
    const [a, b] = arriba.map((id) => mazo[id]);

    if (a.url !== b.url) {
      errores.current += 1;
      setBloqueado(true);
      setMensaje("casi");
      timers.current.push(
        window.setTimeout(() => {
          setVolteadas([]);
          setBloqueado(false);
          setMensaje("");
        }, 1100),
      );
      return;
    }

    aciertos.current += 1;
    const halladas = [...encontradas, a.url];
    setEncontradas(halladas);
    setVolteadas([]);
    setMensaje("bien");
    timers.current.push(window.setTimeout(() => setMensaje(""), 900));

    if (halladas.length === parejas) {
      const final = resultado(); // el tiempo termina con la última pareja, no con la pantalla de cierre
      timers.current.push(
        window.setTimeout(() => {
          setTerminado(true);
          timers.current.push(window.setTimeout(() => onFinish(final), 1800));
        }, 1200),
      );
    }
  };

  if (mazo.length === 0) {
    return <Typography className="py-8 text-center">No hay imágenes cargadas para este juego.</Typography>;
  }

  if (terminado) {
    return (
      <Stack className="items-center gap-4 py-16">
        <CheckCircleIcon sx={{ fontSize: 96, color: "success.main" }} />
        <Typography variant="h3" className="font-bold">
          ¡Terminaste!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Muy bien hecho
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack className="gap-3 py-4">
      <Stack direction="row" useFlexGap className="items-center justify-center gap-2 flex-wrap">
        <Typography variant="h4" className="font-bold">
          Encontrá las parejas
        </Typography>
      </Stack>
      <Typography variant="h6" color="text.secondary" className="text-center">
        {CONSIGNA}
      </Typography>

      <Box className="min-h-[36px] text-center">
        {mensaje === "bien" && (
          <Typography variant="h5" sx={{ color: "success.main" }} className="font-bold">
            ¡Muy bien!
          </Typography>
        )}
        {mensaje === "casi" && (
          <Typography variant="h5" sx={{ color: "warning.dark" }} className="font-bold">
            ¡Casi! Probá de nuevo
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 760,
          alignSelf: "center",
          display: "grid",
          gridTemplateColumns: { xs: "repeat(5, 1fr)", md: "repeat(6, 1fr)" },
          gap: { xs: 1, md: 1.5 },
          bgcolor: "background.paper",
          borderRadius: 4,
          boxShadow: 2,
          p: { xs: 1.5, md: 2 },
        }}
      >
        {mazo.map((carta) => {
          const hallada = encontradas.includes(carta.url);
          const arriba = hallada || volteadas.includes(carta.id);
          return (
            <ButtonBase
              key={carta.id}
              onClick={() => voltear(carta)}
              aria-label="Carta"
              sx={{ width: "100%", aspectRatio: "1", perspective: "700px", borderRadius: 3, display: "block" }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.4s",
                  transform: arriba ? "rotateY(180deg)" : "none",
                }}
              >
                <Box sx={{ ...cara, bgcolor: "primary.main", display: "grid", placeItems: "center" }}>
                  <Typography variant="h4" sx={{ color: "common.white", fontWeight: 700 }}>
                    ?
                  </Typography>
                </Box>
                <Box
                  sx={{
                    ...cara,
                    bgcolor: "background.paper",
                    border: 4,
                    borderColor: hallada ? "primary.dark" : "divider",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <Box component="img" src={carta.url} alt="" sx={dibujo} />
                  {hallada && (
                    <CheckCircleIcon
                      sx={{ position: "absolute", top: 2, right: 2, color: "success.main", fontSize: 24 }}
                    />
                  )}
                </Box>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Stack>
  );
}
