// 85 -> "01:25"; sin dato (todavía no hay resultado) -> "-"
export const formatearTiempo = (segundos: number | null) =>
  segundos === null
    ? "-"
    : `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
