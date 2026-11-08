import ConectarPalabras from "./ConectarPalabras";
import Memorama from "./Memorama";
import { Juego } from "./Tipos";

// Qué juego corresponde a cada ejercicio del catálogo (por su id). Los que no están acá todavía no tienen juego.
export const JUEGOS: Record<number, Juego> = {
  4: Memorama, // Memorama
  5: ConectarPalabras, // Conectar palabras
};
