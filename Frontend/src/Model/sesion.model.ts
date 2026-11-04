

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}


export interface SesionListItem {
  id: number;
  pacienteId: number;
  fecha: string;
  nombre: string;
  apellido: string;
  objetivo: string | null;
}

export interface SesionEjercicioItem {
  ejercicioId: number;
  ejercicio: string;
  tipoEjercicio: string;
  icono: string;
  orden: number;
  tiempoSegundos: number | null;
}


export interface MetricaValor {
  metricaId: number;
  nombre: string;
  valor: number;
  unidad: string | null;
}

export interface ResultadoDetalle {
  sesionId: number;
  ejercicioId: number;
  ejercicio: string;
  tipoEjercicio: string;
  fecha: string;
  nombre: string;
  apellido: string;
  registrado: boolean;
  aciertos: number;
  errores: number;
  tiempoSegundos: number | null;
  observaciones: string | null;
  metricas: MetricaValor[];
}


export type SesionResponse = PagedResponse<SesionListItem>;
export type SesionEjerciciosResponse = PagedResponse<SesionEjercicioItem>;
