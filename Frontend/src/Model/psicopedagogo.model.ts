

export interface CreatePsicopedagogoRequest{
    correoElectronico: string,
    contrasenia: string,
    contrasenia2?: string,
    avatar?: string,
    nombre: string,
    apellido: string,
    telefono: string,
    documento: string,
    matricula: string,
    genero: string,
    fechaNacimiento: string,
    aceptoTerminos: string | boolean
}

export interface User {
  id: number;
  name: string;
  role: string;
  token: string;
}


export interface PagedResponse<T> {
    items:    T[];
    total:    number;
    page:     number;
    pageSize: number;
}

export interface PsicopedagogoListItem {
  personaId: number;
  correoElectronico: string;
  avatar?: string;
  matricula: string;
  nombre: string;
  apellido: string;
  fechaSolicitud: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'suspendido';
}

export interface UpdateStateRequest {
  motivo?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'suspendido';
}


export type PsicopedagogoResponse = PagedResponse<PsicopedagogoListItem>;

