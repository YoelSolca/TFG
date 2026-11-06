import type { PagedResponse } from "./Common.model";

export interface EjercicioListItem {
  id: number;
  nombre: string;
  tipoEjercicio: string;
  descripcion: string | null;
}

export type EjercicioResponse = PagedResponse<EjercicioListItem>;
