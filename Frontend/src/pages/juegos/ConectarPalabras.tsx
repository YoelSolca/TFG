import { useEffect, useRef, useState } from "react";
import { Box, Button, ButtonBase, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import CargarImagenes, { Banco } from "./CargarImagenes";
import { JuegoProps } from "./tipos";

// Con las 25 cosas que hay salen 5 pantallas de 5 sin repetir ninguna. Para más pantallas hay que sumar dibujos.
const PANTALLAS = 5;
const PARES_POR_PANTALLA = 5;
const CONSIGNA = "Tocá un dibujo y después su palabra";

// Cada cosa de las imágenes del juego (conectar-palabras) tiene varios dibujos, de los que se sortea uno.
// Se generan con scripts/generar-personajes.mjs.

// El nombre de la carpeta no lleva tildes; la palabra que se lee, sí.
const PALABRAS: Record<string, string> = { arbol: "ÁRBOL", avion: "AVIÓN" };
const palabraDe = (cosa: string) => PALABRAS[cosa] ?? cosa.toUpperCase();

// Cada pareja unida se pinta de un color distinto (ninguno es rojo).
const COLORES = ["#2e7d32", "#1565c0", "#ef6c00", "#6a1b9a", "#00838f"];

type Tipo = "dibujo" | "palabra";
interface Marca {
  tipo: Tipo;
  clave: string;
}

interface Par {
  clave: string;
  url: string;
}

interface Pantalla {
  dibujos: Par[];
  palabras: Par[];
}

const sacudir = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
`;

const latir = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
`;

const mezclar = <T,>(lista: T[]): T[] => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

// Cada pantalla tiene 5 cosas distintas; los dibujos y las palabras se muestran en orden distinto.
function crearPantallas(banco: Banco): Pantalla[] {
  const pares = mezclar(Object.keys(banco))
    .slice(0, PANTALLAS * PARES_POR_PANTALLA)
    .map((clave) => ({ clave, url: banco[clave][Math.floor(Math.random() * banco[clave].length)] }));
  const pantallas: Pantalla[] = [];
  for (let i = 0; i + PARES_POR_PANTALLA <= pares.length; i += PARES_POR_PANTALLA) {
    const grupo = pares.slice(i, i + PARES_POR_PANTALLA);
    pantallas.push({ dibujos: mezclar(grupo), palabras: mezclar(grupo) });
  }
  return pantallas;
}

// Primero se descarga la lista de imágenes y recién entonces arranca el juego.
export default function ConectarPalabras(props: JuegoProps) {
  return <CargarImagenes juego="conectar-palabras">{(banco) => <Juego {...props} banco={banco} />}</CargarImagenes>;
}

function Juego({ onFinish, banco }: JuegoProps & { banco: Banco }) {
  const [pantallas] = useState(() => crearPantallas(banco));
  const [indice, setIndice] = useState(0);
  const [elegida, setElegida] = useState<Marca | null>(null);
  const [unidas, setUnidas] = useState<string[]>([]);
  const [malas, setMalas] = useState<Marca[]>([]);
  const [pista, setPista] = useState<Marca | null>(null);
  const [mensaje, setMensaje] = useState<"" | "bien" | "casi">("");
  const [bloqueado, setBloqueado] = useState(false);
  const [terminado, setTerminado] = useState(false);

  // Lo que se guarda va en refs: los timers leen siempre el valor actual.
  const aciertos = useRef(0);
  const errores = useRef(0);
  const pistas = useRef(0);
  const inicio = useRef(Date.now());
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pendientes = timers;
    return () => pendientes.current.forEach(clearTimeout);
  }, []);

  const pantalla = pantallas[indice];

  const resultado = () => ({
    aciertos: aciertos.current,
    errores: errores.current,
    tiempoSegundos: Math.round((Date.now() - inicio.current) / 1000),
    metricas: [{ nombre: "pistas", valor: pistas.current }],
  });

  const tocar = (tipo: Tipo, clave: string) => {
    if (bloqueado || terminado || unidas.includes(clave)) return;

    // Primer toque (o otro del mismo tipo): se elige; tocar lo elegido de nuevo lo suelta.
    if (!elegida || elegida.tipo === tipo) {
      setPista(null);
      setElegida(elegida?.tipo === tipo && elegida.clave === clave ? null : { tipo, clave });
      return;
    }

    if (elegida.clave !== clave) {
      errores.current += 1;
      setMalas([elegida, { tipo, clave }]);
      setElegida(null);
      setPista(null);
      setMensaje("casi");
      setBloqueado(true);
      timers.current.push(
        window.setTimeout(() => {
          setMalas([]);
          setMensaje("");
          setBloqueado(false);
        }, 700),
      );
      return;
    }

    aciertos.current += 1;
    const hechas = [...unidas, clave];
    setUnidas(hechas);
    setElegida(null);
    setPista(null);
    setMensaje("bien");
    if (hechas.length < PARES_POR_PANTALLA) {
      timers.current.push(window.setTimeout(() => setMensaje(""), 900));
      return;
    }

    setBloqueado(true);
    if (indice === pantallas.length - 1) {
      const final = resultado(); // el tiempo termina con la última pareja, no con la pantalla de cierre
      timers.current.push(
        window.setTimeout(() => {
          setTerminado(true);
          timers.current.push(window.setTimeout(() => onFinish(final), 1800));
        }, 1200),
      );
    } else {
      timers.current.push(
        window.setTimeout(() => {
          setIndice((i) => i + 1);
          setUnidas([]);
          setMensaje("");
          setBloqueado(false);
        }, 1300),
      );
    }
  };

  // La pista marca lo que corresponde a lo que el niño tiene elegido.
  const darPista = () => {
    if (!elegida || bloqueado) return;
    pistas.current += 1;
    setPista({ tipo: elegida.tipo === "dibujo" ? "palabra" : "dibujo", clave: elegida.clave });
    timers.current.push(window.setTimeout(() => setPista(null), 2000));
  };

  if (!pantalla) {
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

  // Estilo de cada casillero según su estado: unido (con el color de su pareja), elegido, con pista o equivocado.
  const casillero = (tipo: Tipo, clave: string) => {
    const posUnida = unidas.indexOf(clave);
    const unida = posUnida >= 0;
    const esElegida = elegida?.tipo === tipo && elegida.clave === clave;
    const conPista = pista?.tipo === tipo && pista.clave === clave;
    const mala = malas.some((m) => m.tipo === tipo && m.clave === clave);
    const color = unida ? COLORES[posUnida] : undefined;
    return {
      unida,
      color,
      sx: {
        width: "100%",
        height: { xs: 84, md: 100 },
        position: "relative",
        border: 4,
        borderColor: color ?? (esElegida || conPista ? "primary.main" : "divider"),
        bgcolor: color ? `${color}1f` : esElegida ? "action.selected" : "background.paper",
        borderRadius: 3,
        transition: "border-color 0.2s, background-color 0.2s",
        animation: mala ? `${sacudir} 0.35s` : conPista ? `${latir} 0.7s infinite` : "none",
        "&:hover": { borderColor: color ?? "primary.light" },
      },
    };
  };

  return (
    <Stack className="gap-3 py-4">
      <Typography variant="h4" className="font-bold text-center">
        Conectá cada dibujo con su palabra
      </Typography>
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
            ¡Casi! Probá con otra
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: 640,
          alignSelf: "center",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: { xs: 2, md: 8 },
          rowGap: 1.5,
          bgcolor: "background.paper",
          borderRadius: 4,
          boxShadow: 2,
          p: { xs: 2, md: 3 },
        }}
      >
        {pantalla.dibujos.map((d, fila) => {
          const p = pantalla.palabras[fila];
          const a = casillero("dibujo", d.clave);
          const b = casillero("palabra", p.clave);
          return (
            <Box key={d.clave} sx={{ display: "contents" }}>
              <ButtonBase onClick={() => tocar("dibujo", d.clave)} aria-label="Dibujo" sx={a.sx}>
                <Box
                  component="img"
                  src={d.url}
                  alt=""
                  sx={{ width: "calc(100% - 12px)", height: "calc(100% - 12px)", objectFit: "contain" }}
                />
                {a.unida && <CheckCircleIcon sx={{ position: "absolute", top: 2, right: 2, color: a.color, fontSize: 24 }} />}
              </ButtonBase>
              <ButtonBase onClick={() => tocar("palabra", p.clave)} aria-label={`Palabra ${palabraDe(p.clave)}`} sx={b.sx}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                  {palabraDe(p.clave)}
                </Typography>
                {b.unida && <CheckCircleIcon sx={{ position: "absolute", top: 2, right: 2, color: b.color, fontSize: 24 }} />}
              </ButtonBase>
            </Box>
          );
        })}
      </Box>

      <Stack direction="row" className="items-center justify-end">
        <Button
          size="small"
          color="inherit"
          startIcon={<LightbulbOutlinedIcon />}
          disabled={!elegida || bloqueado}
          onClick={darPista}
          sx={{ color: "text.disabled" }}
        >
          Pista
        </Button>
      </Stack>
    </Stack>
  );
}
