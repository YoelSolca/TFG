/** Item de GET /api/pacientes (PacienteListItemDto). fechaNacimiento llega como "yyyy-MM-dd". */
export interface PacienteListItem {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  fechaNacimiento: string;
  tiposDificultad: string[];
}

/** Respuesta paginada de GET /api/pacientes (PagedResponse<T>). */
export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Query params de GET /api/pacientes. */
export interface PacientesQuery {
  search?: string;
  tipoDificultadId?: number;
  page?: number;
  pageSize?: number;
}

export interface TipoDificultad {
  id: number;
  nombre: string;
}

export interface TipoEjercicio {
  id: number;
  nombre: string;
}


export type PacientesResponse = PagedResponse<PacienteListItem>;
export type HistorialPacienteResponse = PagedResponse<HistorialPacienteItem>;
export type PacienteInformeResponse = PagedResponse<PacienteInformeItem>;

export interface PacienteInformeItem {
  id : number;
  pacienteId : number;
  fechaGeneracion : Date;
  psicopedagogoId : number;
  contenido : string;
  periodoDesde : Date;
  periodoHasta : Date;
}

export interface HistorialPacienteItem {
  sesionId:       number;
  ejercicioId:    number;
  fecha:          Date;
  tipoEjercicio:  string;
  ejercicio:      string;
  icono:          string;
  aciertos:       number;
  errores:        number;
  tiempoSegundos: number;
  observaciones:  string;
  metricas:       Metrica[];
}

export interface EjercicioSeguimiento {
  ejercicioId:     number;
  ejercicio:       string;
  tipoEjercicioId: number;
  tipoEjercicio:   string;
  aciertos:        number;
  errores:         number;
  observaciones:   string | null;
}

export interface SesionSeguimiento {
  sesionId:   number;
  fecha:      string; // llega como texto ISO, p. ej. "2026-10-13T10:30:00"
  ejercicios: EjercicioSeguimiento[];
}

export interface Metrica {
  nombre: string;
  valor:  number;
  unidad: null;
}
