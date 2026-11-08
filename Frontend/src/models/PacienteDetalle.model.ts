export interface PacienteDetalle {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  fechaNacimiento: string;
  genero: string;
  objetivo: string;
  observaciones: string;
  tiposDificultad: TiposDificultad[];
  ultimaSesion: UltimaSesion | null; // null si el paciente todavía no tuvo sesiones
}

export interface TiposDificultad {
  id: number;
  nombre: string;
}

export interface UltimaSesion {
  id: number;
  fecha: Date;
  tiposEjercicio: string[];
}
