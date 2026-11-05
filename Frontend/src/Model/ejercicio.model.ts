export interface PagedResponse<T> {
    items:    T[];
    total:    number;
    page:     number;
    pageSize: number;
}

export interface EjercicioListItem {
    id:            number;
    nombre:        string;
    tipoEjercicio: string;
    descripcion:   string | null;
}





export type EjercicioResponse = PagedResponse<EjercicioListItem>;
