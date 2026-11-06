import type { PagedResponse } from "./Common.model";

export interface PacienteListItem {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  fechaNacimiento: string;
  tiposDificultad: string[];
}

export type PacientesResponse = PagedResponse<PacienteListItem>;

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

export interface CrearPacienteRequest {
  nombre: string;
  apellido: string;
  documento: string;
  genero: string;
  fechaNacimiento: string;
  direccion: string;
  objetivo: string | null;
  observaciones: string | null;
  tiposDificultadIds: number[];
}

export interface PacienteCreado {
  personaId: number;
  direccion: string;
  fechaAlta: string;
}

export interface RegistroPaciente {
  paciente: PacienteCreado;
  creado: boolean;
}
