import dayjs, { Dayjs } from "dayjs";
import { SesionEvolucion } from "../models/Evolucion.model";

// Con menos sesiones de un área que estas no se compara "al empezar" contra "ahora".
export const MIN_PARA_COMPARAR = 4;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const promedio = (valores: number[]) => valores.reduce((suma, v) => suma + v, 0) / valores.length;

export interface EjercicioResumen {
  nombre: string;
  area: string;
  aciertos: number;
  errores: number;
  porcentaje: number;
  observaciones: string | null;
}

export interface SesionResumen {
  id: number;
  fecha: Dayjs;
  porcentaje: number; // promedio de los ejercicios de la sesión, redondeado
  areas: Record<string, number>; // porcentaje de la sesión en cada área, redondeado
  ejercicios: EjercicioResumen[];
}

// Cada ejercicio cuenta igual en la sesión, sin importar cuántos ítems tenga.
// Un ejercicio sin aciertos ni errores no tiene porcentaje: se ignora, y si la sesión se queda sin ejercicios se descarta.
function resumirSesion(sesion: SesionEvolucion): SesionResumen | null {
  const ejercicios = sesion.ejercicios
    .filter((e) => e.aciertos + e.errores > 0)
    .map((e) => ({
      nombre: e.ejercicio,
      area: e.tipoEjercicio,
      aciertos: e.aciertos,
      errores: e.errores,
      porcentaje: (100 * e.aciertos) / (e.aciertos + e.errores),
      observaciones: e.observaciones,
    }));

  if (ejercicios.length === 0) return null;

  const porArea: Record<string, number[]> = {};
  ejercicios.forEach((e) => (porArea[e.area] ??= []).push(e.porcentaje));

  return {
    id: sesion.sesionId,
    fecha: dayjs(sesion.fecha),
    porcentaje: Math.round(promedio(ejercicios.map((e) => e.porcentaje))),
    areas: Object.fromEntries(Object.entries(porArea).map(([area, lista]) => [area, Math.round(promedio(lista))])),
    ejercicios,
  };
}

// De la más vieja a la más nueva, que es como las necesitan el gráfico y la constancia.
export function resumirSesiones(sesiones: SesionEvolucion[]): SesionResumen[] {
  return sesiones
    .map(resumirSesion)
    .filter((s): s is SesionResumen => s !== null)
    .sort((a, b) => a.fecha.valueOf() - b.fecha.valueOf());
}

export type AreaProgreso =
  | { area: string; pocosDatos: true; cantidad: number; ultimo: number; desde: Dayjs }
  | { area: string; pocosDatos: false; cantidad: number; antes: number; ahora: number; diferencia: number };

// Cada área se compara solo consigo misma: promedio de sus primeras 2 sesiones contra sus últimas 2.
export function progresoPorArea(sesiones: SesionResumen[]): AreaProgreso[] {
  const porArea: Record<string, { porcentaje: number; fecha: Dayjs }[]> = {};
  sesiones.forEach((s) =>
    Object.entries(s.areas).forEach(([area, porcentaje]) =>
      (porArea[area] ??= []).push({ porcentaje, fecha: s.fecha }),
    ),
  );

  return Object.entries(porArea).map(([area, lista]): AreaProgreso => {
    const valores = lista.map((x) => x.porcentaje);

    if (valores.length < MIN_PARA_COMPARAR) {
      return {
        area,
        pocosDatos: true,
        cantidad: valores.length,
        ultimo: valores[valores.length - 1],
        desde: lista[0].fecha,
      };
    }

    const antes = Math.round(promedio(valores.slice(0, 2)));
    const ahora = Math.round(promedio(valores.slice(-2)));
    return { area, pocosDatos: false, cantidad: valores.length, antes, ahora, diferencia: ahora - antes };
  });
}

// Las áreas del catálogo, en el orden en que se muestran. Si llega otra (un tipo nuevo), se agrega al final.
const AREAS_DEL_CATALOGO = ["Atención", "Memoria", "Lectura", "Escritura", "Cálculo"];

export interface EjerciciosDeArea {
  area: string;
  cantidad: number;
  ejercicios: { nombre: string; cantidad: number }[]; // qué ejercicios fueron y cuántas veces se hizo cada uno
}

// Cuántos ejercicios se hicieron en cada área del período. Las áreas sin ejercicios quedan en 0: no trabajarlas también es un dato.
export function ejerciciosPorArea(sesiones: SesionResumen[]): EjerciciosDeArea[] {
  const cuenta: Record<string, Record<string, number>> = {};
  sesiones.forEach((s) =>
    s.ejercicios.forEach((e) => {
      const deLaArea = (cuenta[e.area] ??= {});
      deLaArea[e.nombre] = (deLaArea[e.nombre] ?? 0) + 1;
    }),
  );

  const otras = Object.keys(cuenta).filter((area) => !AREAS_DEL_CATALOGO.includes(area));
  return [...AREAS_DEL_CATALOGO, ...otras].map((area) => {
    const ejercicios = Object.entries(cuenta[area] ?? {})
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
    return { area, cantidad: ejercicios.reduce((suma, e) => suma + e.cantidad, 0), ejercicios };
  });
}

export interface PuntoAciertos {
  fecha: Dayjs;
  porcentaje: number;
  ejercicios: EjercicioResumen[]; // los que forman el punto (de esa área, si se eligió una)
  aciertos: number;
  errores: number;
}

// Un punto por sesión con su porcentaje de aciertos; si se elige un área, solo las sesiones en las que se trabajó esa área.
export function aciertosPorSesion(sesiones: SesionResumen[], area?: string): PuntoAciertos[] {
  return sesiones.flatMap((s) => {
    const porcentaje = area ? s.areas[area] : s.porcentaje;
    if (porcentaje === undefined) return [];

    const ejercicios = area ? s.ejercicios.filter((e) => e.area === area) : s.ejercicios;
    return [
      {
        fecha: s.fecha,
        porcentaje,
        ejercicios,
        aciertos: ejercicios.reduce((suma, e) => suma + e.aciertos, 0),
        errores: ejercicios.reduce((suma, e) => suma + e.errores, 0),
      },
    ];
  });
}

// Las áreas que aparecen en las sesiones, en el orden del catálogo.
export function areasConSesiones(sesiones: SesionResumen[]): string[] {
  const presentes = new Set(sesiones.flatMap((s) => Object.keys(s.areas)));
  const otras = [...presentes].filter((a) => !AREAS_DEL_CATALOGO.includes(a));
  return [...AREAS_DEL_CATALOGO.filter((a) => presentes.has(a)), ...otras];
}

export interface EjercicioDificil {
  nombre: string;
  area: string;
  veces: number; // cuántas veces se hizo en el período
  errores: number;
  porcentaje: number; // aciertos sobre el total de intentos de todas las veces
}

// Los ejercicios con menor porcentaje de aciertos del período (solo los que tuvieron algún error).
// Un ejercicio hecho una sola vez cuenta igual: por eso se muestra cuántas veces se hizo.
export function dondeMasCuesta(sesiones: SesionResumen[], maximo = 3): EjercicioDificil[] {
  const porNombre: Record<string, { area: string; veces: number; aciertos: number; errores: number }> = {};
  sesiones.forEach((s) =>
    s.ejercicios.forEach((e) => {
      const acumulado = (porNombre[e.nombre] ??= { area: e.area, veces: 0, aciertos: 0, errores: 0 });
      acumulado.veces += 1;
      acumulado.aciertos += e.aciertos;
      acumulado.errores += e.errores;
    }),
  );

  return Object.entries(porNombre)
    .filter(([, x]) => x.errores > 0)
    .map(([nombre, x]) => ({
      nombre,
      area: x.area,
      veces: x.veces,
      errores: x.errores,
      porcentaje: Math.round((100 * x.aciertos) / (x.aciertos + x.errores)),
    }))
    .sort((a, b) => a.porcentaje - b.porcentaje || b.errores - a.errores)
    .slice(0, maximo);
}

export interface Semana {
  inicio: Dayjs; // el lunes
  mes: string; // "oct"
  numeroMes: number;
  cantidad: number; // sesiones de esa semana
}

export interface Constancia {
  semanas: Semana[];
  total: number;
  porSemana: number;
  mayorPausa: { dias: number; desde: Dayjs; hasta: Dayjs } | null;
}

const lunesDe = (fecha: Dayjs) => fecha.subtract((fecha.day() + 6) % 7, "day").startOf("day");

// Una celda por semana, desde la primera hasta la última sesión; más el total, el promedio por semana y la mayor pausa entre dos sesiones.
export function calcularConstancia(sesiones: SesionResumen[]): Constancia {
  if (sesiones.length === 0) return { semanas: [], total: 0, porSemana: 0, mayorPausa: null };

  const ultima = sesiones[sesiones.length - 1].fecha;
  const semanas: Semana[] = [];

  for (let lunes = lunesDe(sesiones[0].fecha); !lunes.isAfter(ultima); lunes = lunes.add(7, "day")) {
    const siguiente = lunes.add(7, "day");
    semanas.push({
      inicio: lunes,
      mes: MESES[lunes.month()],
      numeroMes: lunes.month(),
      cantidad: sesiones.filter((s) => !s.fecha.isBefore(lunes) && s.fecha.isBefore(siguiente)).length,
    });
  }

  let mayorPausa: Constancia["mayorPausa"] = null;
  for (let i = 1; i < sesiones.length; i += 1) {
    const dias = sesiones[i].fecha.startOf("day").diff(sesiones[i - 1].fecha.startOf("day"), "day");
    if (!mayorPausa || dias > mayorPausa.dias) {
      mayorPausa = { dias, desde: sesiones[i - 1].fecha, hasta: sesiones[i].fecha };
    }
  }

  return { semanas, total: sesiones.length, porSemana: sesiones.length / semanas.length, mayorPausa };
}
