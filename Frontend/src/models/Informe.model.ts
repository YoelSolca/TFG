import type { PagedResponse } from "./Common.model";

export type PacienteInformeResponse = PagedResponse<PacienteInformeItem>;

export interface PacienteInformeItem {
  id: number;
  pacienteId: number;
  fechaGeneracion: Date;
  psicopedagogoId: number;
  contenido: string;
  periodoDesde: Date;
  periodoHasta: Date;
  resumen: string;
}

export interface InformeCreado {
  id: number;
  pacienteId: number;
  psicopedagogoId: number;
  fechaGeneracion: string;
  periodoDesde: string;
  periodoHasta: string;
  contenido: string;
}
