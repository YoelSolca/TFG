import type { PagedResponse } from "./Common.model";

export interface CreatePsicopedagogoRequest {
  correoElectronico: string;
  contrasenia: string;
  contrasenia2?: string;
  avatar?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  documento: string;
  matricula: string;
  genero: string;
  fechaNacimiento: string;
  aceptoTerminos: string | boolean;
}

export interface PsicopedagogoListItem {
  personaId: number;
  correoElectronico: string;
  avatar?: string;
  matricula: string;
  nombre: string;
  apellido: string;
  fechaSolicitud: string;
  estado: "pendiente" | "aprobado" | "rechazado" | "suspendido";
  // Para verificar la matrícula y decidir sobre la cuenta (los fechas llegan como texto ISO).
  documento: string;
  telefono: string;
  genero: string | null;
  fechaNacimiento: string | null;
  fechaAprobacion: string | null;
  pacientesActivos: number;
  ultimaActividad: string | null;
  motivo: string | null; // por qué está rechazada o suspendida
}

export interface UpdateStateRequest {
  motivo?: string;
  estado: "pendiente" | "aprobado" | "rechazado" | "suspendido";
}

export interface PerfilPsicopedagogo {
  personaId: number;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  genero: string | null;
  fechaNacimiento: string | null;
  correoElectronico: string;
  matricula: string;
  avatar: string | null;
  estado: string;
}

export interface UpdatePerfilRequest {
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  genero: string;
  fechaNacimiento: string;
  correoElectronico: string;
  contraseniaActual?: string;
}

export interface ChangePasswordRequest {
  contraseniaActual: string;
  nuevaContrasenia: string;
}

export type PsicopedagogoResponse = PagedResponse<PsicopedagogoListItem>;
