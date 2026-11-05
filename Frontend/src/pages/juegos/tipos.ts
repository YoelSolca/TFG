import { ComponentType } from "react";

// Lo que un juego le entrega a la pantalla de la sesión cuando termina.
export interface ResultadoJuego {
  aciertos: number;
  errores: number;
  tiempoSegundos: number;
  // Métricas propias del juego (por ejemplo "movimientos" en el Memorama). Los juegos que no tienen ninguna no la mandan.
  metricas?: { nombre: string; valor: number }[];
}

export interface JuegoProps {
  onFinish: (resultado: ResultadoJuego) => void;
}

export type Juego = ComponentType<JuegoProps>;
