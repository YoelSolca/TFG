import { ReactNode, useEffect, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";

// Las imágenes de los juegos están en un repositorio aparte (psico-juegos-imagenes) publicado con GitHub Pages.
// Se puede apuntar a otro lugar con VITE_IMAGENES_URL (por ejemplo, una carpeta de IIS o un Azure Blob).
const BASE = (import.meta.env.VITE_IMAGENES_URL ?? "https://yoelsolca.github.io/psico-juegos-imagenes").replace(/\/$/, "");

// Nombre del dibujo (perro, casa...) → direcciones de sus imágenes.
export type Banco = Record<string, string[]>;

// Cada juego tiene un manifest.json con la lista de dibujos; con eso se arman las direcciones de las imágenes.
async function cargarBanco(juego: string): Promise<Banco> {
  const respuesta = await fetch(`${BASE}/${juego}/manifest.json`);
  if (!respuesta.ok) throw new Error(`No se pudo leer el manifest de ${juego} (${respuesta.status})`);
  const manifest = (await respuesta.json()) as Record<string, string[]>;
  return Object.fromEntries(
    Object.entries(manifest).map(([nombre, archivos]) => [nombre, archivos.map((a) => `${BASE}/${juego}/${nombre}/${a}`)]),
  );
}

// Descarga la lista de imágenes del juego y recién entonces muestra el juego.
export default function CargarImagenes({ juego, children }: { juego: string; children: (banco: Banco) => ReactNode }) {
  const [banco, setBanco] = useState<Banco | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setError(false);
    cargarBanco(juego)
      .then((cargado) => vigente && setBanco(cargado))
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, [juego, intento]);

  if (error) {
    return (
      <Stack className="items-center gap-3 py-12">
        <Alert severity="warning">No se pudieron cargar las imágenes del juego. Revisá la conexión a internet.</Alert>
        <Button variant="contained" onClick={() => setIntento((n) => n + 1)}>
          Reintentar
        </Button>
      </Stack>
    );
  }

  if (!banco) {
    return <Typography className="py-12 text-center text-gray-500">Cargando...</Typography>;
  }

  return <>{children(banco)}</>;
}
