

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


export interface EjercicioRealizadoItem {
  sesionId: number;
  ejercicioId: number;
  pacienteId: number;
  nombre: string;
  apellido: string;
  ejercicio: string;
  tipoEjercicio: string;
  fecha: string;
}

export interface InformeListItem {
  id: number;
  pacienteId: number;
  nombre: string;
  apellido: string;
  fechaGeneracion: string;
  periodoDesde: string;
  periodoHasta: string;
  resumen: string;
}

export interface InformeDetalle {
  id: number;
  pacienteId: number;
  nombre: string;
  apellido: string;
  documento: string;
  fechaNacimiento: string | null;
  fechaGeneracion: string;
  periodoDesde: string;
  periodoHasta: string;
  contenido: string;
}

export type InformeResponse = PagedResponse<InformeListItem>;
export type EjercicioRealizadoResponse = PagedResponse<EjercicioRealizadoItem>;
export type SesionResponse = PagedResponse<SesionListItem>;
export type SesionEjerciciosResponse = PagedResponse<SesionEjercicioItem>;
