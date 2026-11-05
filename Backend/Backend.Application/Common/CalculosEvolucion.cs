using Backend.Application.DTO;
using Backend.Application.Interfaces;

namespace Backend.Application.Common
{
    // Cálculos de la evolución de un paciente para el informe. IMPORTANTE: es la misma regla que
    // Frontend/src/utils/Evolucion.ts (que dibuja la pestaña Evolución). Si cambia una, hay que cambiar la otra
    // o el informe y la pantalla van a mostrar números distintos.
    public static class CalculosEvolucion
    {
        // ───────────── Parte A: resumen de cada sesión ─────────────

        // Una sesión ya resumida. Porcentaje va redondeado; Ejercicios es lo que se le manda a Claude.
        public record SesionResumen(
            int Id,
            DateTime Fecha,
            int Porcentaje,
            IReadOnlyList<EjercicioInforme> Ejercicios)
        {
            public SesionInforme ToInforme() => new(DateOnly.FromDateTime(Fecha), Porcentaje, Ejercicios);
        }

        // De la más vieja a la más nueva, que es como las necesitan los aciertos por sesión y la constancia.
        public static IReadOnlyList<SesionResumen> ResumirSesiones(IEnumerable<SesionEvolucionDto> sesiones) =>
            sesiones
                .Select(ResumirSesion)
                .OfType<SesionResumen>() // descarta los null: sesiones que quedaron sin ejercicios con datos
                .OrderBy(s => s.Fecha)
                .ToList();

        // Cada ejercicio cuenta igual en la sesión, sin importar cuántos ítems tenga. Un ejercicio sin aciertos ni errores
        // no tiene porcentaje (daría división por cero): se ignora, y si la sesión se queda sin ejercicios se descarta.
        private static SesionResumen? ResumirSesion(SesionEvolucionDto sesion)
        {
            // Se promedian los porcentajes SIN redondear; el redondeo es solo al final.
            var ejercicios = sesion.Ejercicios
                .Where(e => e.Aciertos + e.Errores > 0)
                .Select(e => (Ejercicio: e, Exacto: 100.0 * e.Aciertos / (e.Aciertos + e.Errores)))
                .ToList();

            if (ejercicios.Count == 0) return null;

            return new SesionResumen(
                sesion.SesionId,
                sesion.Fecha,
                Redondear(ejercicios.Average(x => x.Exacto)),
                ejercicios
                    .Select(x => new EjercicioInforme(
                        x.Ejercicio.Ejercicio,
                        x.Ejercicio.TipoEjercicio,
                        x.Ejercicio.Aciertos,
                        x.Ejercicio.Errores,
                        Redondear(x.Exacto),
                        x.Ejercicio.Observaciones,
                        x.Ejercicio.TiempoSegundos,
                        x.Ejercicio.Pistas))
                    .ToList());
        }

        // ───────────── Parte B: ejercicios por área y dónde más cuesta ─────────────

        // Las áreas del catálogo, en el orden en que se muestran. Si llega otra (un tipo nuevo), se agrega al final.
        private static readonly string[] AreasDelCatalogo = ["Atención", "Memoria", "Lectura", "Escritura", "Cálculo"];

        // Cuántos ejercicios se hicieron en cada área del período. Las áreas sin ejercicios quedan en 0: no trabajarlas también es un dato.
        public static IReadOnlyList<AreaEjerciciosInforme> EjerciciosPorArea(IReadOnlyList<SesionResumen> sesiones)
        {
            var cuenta = sesiones
                .SelectMany(s => s.Ejercicios)
                .GroupBy(e => e.Area)
                .ToDictionary(g => g.Key, g => g.Count());

            var otras = cuenta.Keys.Where(a => !AreasDelCatalogo.Contains(a));
            return AreasDelCatalogo
                .Concat(otras)
                .Select(area => new AreaEjerciciosInforme(area, cuenta.GetValueOrDefault(area)))
                .ToList();
        }

        // Los ejercicios con menor porcentaje de aciertos del período (solo los que tuvieron algún error). Un ejercicio hecho
        // una sola vez cuenta igual: por eso se informa cuántas veces se hizo. A igual porcentaje va primero el de más errores.
        public static IReadOnlyList<EjercicioDificilInforme> DondeMasCuesta(IReadOnlyList<SesionResumen> sesiones, int maximo = 3) =>
            sesiones
                .SelectMany(s => s.Ejercicios)
                .GroupBy(e => e.Nombre)
                .Select(g => (Nombre: g.Key, Area: g.First().Area, Veces: g.Count(), Aciertos: g.Sum(e => e.Aciertos), Errores: g.Sum(e => e.Errores)))
                .Where(x => x.Errores > 0)
                .Select(x => new EjercicioDificilInforme(
                    x.Nombre, x.Area, x.Veces, x.Aciertos, x.Errores, Redondear(100.0 * x.Aciertos / (x.Aciertos + x.Errores))))
                .OrderBy(x => x.Porcentaje)
                .ThenByDescending(x => x.Errores)
                .Take(maximo)
                .ToList();

        // ───────────── Parte C: constancia ─────────────

        // Semanas de lunes a domingo, desde la primera hasta la última sesión del período; más el total, el promedio
        // por semana y la mayor pausa entre dos sesiones seguidas (en días de calendario, sin la hora).
        public static ConstanciaInforme CalcularConstancia(IReadOnlyList<SesionResumen> sesiones)
        {
            if (sesiones.Count == 0) return new ConstanciaInforme(0, 0, 0, 0, null, null, null);

            var ultima = sesiones[^1].Fecha;
            var semanasTotales = 0;
            var semanasConSesion = 0;

            for (var lunes = LunesDe(sesiones[0].Fecha); lunes <= ultima; lunes = lunes.AddDays(7))
            {
                var siguiente = lunes.AddDays(7);
                semanasTotales++;
                if (sesiones.Any(s => s.Fecha >= lunes && s.Fecha < siguiente)) semanasConSesion++;
            }

            // Se queda con la primera pausa más larga: una pausa igual a la mayor no la reemplaza.
            int? mayorPausaDias = null;
            DateTime? pausaDesde = null;
            DateTime? pausaHasta = null;
            for (var i = 1; i < sesiones.Count; i++)
            {
                var dias = (sesiones[i].Fecha.Date - sesiones[i - 1].Fecha.Date).Days;
                if (mayorPausaDias is null || dias > mayorPausaDias)
                {
                    mayorPausaDias = dias;
                    pausaDesde = sesiones[i - 1].Fecha;
                    pausaHasta = sesiones[i].Fecha;
                }
            }

            return new ConstanciaInforme(
                sesiones.Count,
                semanasConSesion,
                semanasTotales,
                (double)sesiones.Count / semanasTotales,
                mayorPausaDias,
                pausaDesde is { } d ? DateOnly.FromDateTime(d) : null,
                pausaHasta is { } h ? DateOnly.FromDateTime(h) : null);
        }

        // DayOfWeek numera igual que dayjs: domingo = 0, lunes = 1 ... sábado = 6. Con (día + 6) % 7 el lunes da 0.
        private static DateTime LunesDe(DateTime fecha) => fecha.Date.AddDays(-(((int)fecha.DayOfWeek + 6) % 7));

        // Math.Round de .NET redondea el .5 al par más cercano (72,5 → 72); Math.round de JavaScript lo sube (72,5 → 73).
        // AwayFromZero da el mismo resultado que el front para números positivos.
        private static int Redondear(double valor) => (int)Math.Round(valor, MidpointRounding.AwayFromZero);
    }
}
