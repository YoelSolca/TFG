/** Edad en años cumplidos a partir de una fecha "yyyy-MM-dd" (como llega del Back). */
export function calcularEdad(fechaNacimiento: string, hoy: Date = new Date()): number {
  const [anio, mes, dia] = fechaNacimiento.split("-").map(Number);

  let edad = hoy.getFullYear() - anio;

  // Si todavía no cumplió años este año, se resta uno.
  const cumpleEsteAnio = hoy.getMonth() + 1 > mes || (hoy.getMonth() + 1 === mes && hoy.getDate() >= dia);
  if (!cumpleEsteAnio) edad--;

  return edad;
}

/** "8 años", "1 año". */
export function formatearEdad(fechaNacimiento: string): string {
  const edad = calcularEdad(fechaNacimiento);
  return `${edad} años`;
}
