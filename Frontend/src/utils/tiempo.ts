import dayjs from "dayjs";

// 85 -> "01:25"; sin dato (todavía no hay resultado) -> "-"
export const formatearTiempo = (segundos: number | null) =>
  segundos === null
    ? "-"
    : `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;

// "Hace 2 h" si fue en las últimas 24 horas; si no, "29/10/2026 · 10:00"
export const formatearCuando = (fecha: string) => {
  const d = dayjs(fecha);
  const horas = dayjs().diff(d, "hour");
  if (horas >= 0 && horas < 24) {
    return horas < 1 ? "Hace menos de 1 h" : `Hace ${horas} h`;
  }
  return d.format("DD/MM/YYYY · HH:mm");
};

// "Hoy · 10:00 hs", "Ayer · 10:00 hs" o "28/10/2026 · 10:00 hs"
export const formatearDiaHora = (fecha: string) => {
  const d = dayjs(fecha);
  const dia = d.isSame(dayjs(), "day") ? "Hoy" : d.isSame(dayjs().subtract(1, "day"), "day") ? "Ayer" : d.format("DD/MM/YYYY");
  return `${dia} · ${d.format("HH:mm")} hs`;
};
