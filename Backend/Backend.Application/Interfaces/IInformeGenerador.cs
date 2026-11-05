namespace Backend.Application.Interfaces
{
    // Redacta el informe de un paciente a partir de los datos de un período.
    // La implementación (Infrastructure) es la que habla con Claude; Application solo conoce este contrato.
    public interface IInformeGenerador
    {
        Task<InformeGenerado> GenerarAsync(DatosInforme datos, CancellationToken ct = default);
    }

    // Lo que devuelve el generador: un resumen corto (para la lista) y el texto completo.
    public record InformeGenerado(string Resumen, string Contenido);

    // Todo lo que sale hacia el servicio externo. A propósito NO incluye nombre, apellido, documento ni dirección:
    // el informe habla de "el paciente" y el encabezado con el nombre lo pone la aplicación.
    // Los porcentajes, los ejercicios por área, los que más cuestan y la constancia vienen YA calculados (misma regla que utils/Evolucion.ts del front):
    // el modelo solo redacta, no hace cuentas.
    public record DatosInforme(
        int EdadAnios,
        string Genero, // "M", "F" u "O"
        string? Objetivo,
        string? ObservacionesGenerales, // las de la intervención (texto libre de la profesional)
        IReadOnlyList<string> Dificultades,
        DateOnly PeriodoDesde,
        DateOnly PeriodoHasta,
        IReadOnlyList<SesionInforme> Sesiones, // de la más vieja a la más nueva
        IReadOnlyList<AreaEjerciciosInforme> EjerciciosPorArea,
        IReadOnlyList<EjercicioDificilInforme> DondeMasCuesta, // los de menor porcentaje de aciertos (hasta 3), solo con errores
        ConstanciaInforme Constancia);

    public record SesionInforme(DateOnly Fecha, int PorcentajeSesion, IReadOnlyList<EjercicioInforme> Ejercicios);

    // Observaciones: texto libre de la profesional sobre ese ejercicio; puede ser null.
    // Segundos = tiempo total del ejercicio; Pistas = pistas usadas (null si el ejercicio no las registra).
    public record EjercicioInforme(string Nombre, string Area, int Aciertos, int Errores, int Porcentaje, string? Observaciones, int? Segundos, int? Pistas);

    // Cantidad de ejercicios hechos en el área durante el período; 0 si el área no se trabajó.
    public record AreaEjerciciosInforme(string Area, int Cantidad);

    // Un ejercicio con todas las veces que se hizo en el período sumadas. Porcentaje = aciertos sobre aciertos más errores.
    public record EjercicioDificilInforme(string Nombre, string Area, int Veces, int Aciertos, int Errores, int Porcentaje);

    // Semanas de lunes a domingo, desde la primera hasta la última sesión del período.
    public record ConstanciaInforme(
        int TotalSesiones,
        int SemanasConSesion,
        int SemanasTotales,
        double PromedioPorSemana,
        int? MayorPausaDias,
        DateOnly? PausaDesde,
        DateOnly? PausaHasta);
}
