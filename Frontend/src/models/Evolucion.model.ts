import type { PagedResponse } from "./Common.model";

export type HistorialPacienteResponse = PagedResponse<HistorialPacienteItem>;

export interface Metrica {
  nombre: string;
  valor: number;
  unidad: null;
}

export interface HistorialPacienteItem {
  sesionId: number;
  ejercicioId: number;
  fecha: Date;
  tipoEjercicio: string;
  ejercicio: string;
  icono: string;
  aciertos: number;
  errores: number;
  tiempoSegundos: number;
  observaciones: string;
  metricas: Metrica[];
}

export interface EjercicioEvolucion {
  ejercicioId: number;
  ejercicio: string;
  tipoEjercicioId: number;
  tipoEjercicio: string;
  aciertos: number;
  errores: number;
  observaciones: string | null;
}

export interface SesionEvolucion {
  sesionId: number;
  fecha: string;
  ejercicios: EjercicioEvolucion[];
}
