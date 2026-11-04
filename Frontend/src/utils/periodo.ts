import dayjs from "dayjs";
import "dayjs/locale/es";

const mes = (fecha: string) =>
  dayjs(fecha).locale("es").format("MMMM").replace(/^\w/, (c) => c.toUpperCase());

// "Enero - Febrero", o solo "Abril" cuando el período cae dentro de un mismo mes.
export function periodoInforme(desde: string, hasta: string): string {
  const inicio = mes(desde);
  const fin = mes(hasta);
  return inicio === fin ? inicio : `${inicio} - ${fin}`;
}
