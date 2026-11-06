import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

const mes = (fecha: string) =>
  dayjs(fecha)
    .locale("es")
    .format("MMMM")
    .replace(/^\w/, (c) => c.toUpperCase());

export function periodoInforme(desde: string, hasta: string): string {
  const inicio = mes(desde);
  const fin = mes(hasta);
  return inicio === fin ? inicio : `${inicio} - ${fin}`;
}

// Formato de fecha que espera el servidor.
export const FORMATO_API = "YYYY-MM-DD";

// Períodos rápidos para elegir un rango de fechas; se miden desde hoy hacia atrás.
export const PERIODOS_RAPIDOS = [
  { valor: "1m", etiqueta: "Último mes", meses: 1 },
  { valor: "3m", etiqueta: "Últimos 3 meses", meses: 3 },
  { valor: "6m", etiqueta: "Últimos 6 meses", meses: 6 },
  { valor: "12m", etiqueta: "Último año", meses: 12 },
];

export const rangoDesdeHoy = (meses: number): { desde: Dayjs; hasta: Dayjs } => {
  const hoy = dayjs();
  return { desde: hoy.subtract(meses, "month"), hasta: hoy };
};
