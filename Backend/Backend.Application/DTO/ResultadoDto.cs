using System.ComponentModel.DataAnnotations;
using Backend.Domain.Entities;

namespace Backend.Application.DTO;

public record ResultadoMetricaDto(int MetricaId, string Nombre, decimal Valor, string? Unidad)
{
    public static ResultadoMetricaDto FromEntity(ResultadoMetrica rm) =>
        new(rm.MetricaId, rm.Metrica.Nombre, rm.Valor, rm.Metrica.Unidad);
}

public record ResultadoDto(
    int SesionId,
    int EjercicioId,
    int Aciertos,
    int Errores,
    int? TiempoSegundos,
    string? Observaciones,
    DateTime FechaRegistro,
    IReadOnlyList<ResultadoMetricaDto> Metricas)
{
    public static ResultadoDto FromEntity(Resultado r) => new(
        r.SesionId, r.EjercicioId, r.Aciertos, r.Errores, r.TiempoSegundos, r.Observaciones, r.FechaRegistro,
        r.ResultadoMetricas.Select(ResultadoMetricaDto.FromEntity).ToList());
}

// Resultado de un ejercicio de una sesión junto con el contexto que muestra la pantalla (ejercicio, paciente y fecha).
// Se arma desde el ejercicio de la sesión, así que también existe cuando todavía no hay resultado (Registrado = false).
public record ResultadoDetalleDto(
    int SesionId,
    int EjercicioId,
    string Ejercicio,
    string TipoEjercicio,
    DateTime Fecha,
    string Nombre,
    string Apellido,
    bool Registrado,
    int Aciertos,
    int Errores,
    int? TiempoSegundos,
    string? Observaciones,
    IReadOnlyList<ResultadoMetricaDto> Metricas)
{
    public static ResultadoDetalleDto FromEntity(SesionEjercicio se)
    {
        var persona = se.Sesion.PsicopedagogoPaciente.Paciente.Persona;
        var r = se.Resultado;

        return new(
            se.SesionId, se.EjercicioId,
            se.Ejercicio.Nombre, se.Ejercicio.TipoEjercicio.Nombre,
            se.Sesion.Fecha, persona.Nombre, persona.Apellido,
            r is not null,
            r?.Aciertos ?? 0, r?.Errores ?? 0, r?.TiempoSegundos, r?.Observaciones,
            r?.ResultadoMetricas.Select(ResultadoMetricaDto.FromEntity).ToList() ?? []);
    }
}

public record MetricaValorRequest(
    [Required] int MetricaId,
    [Required] decimal Valor
);

public record UpsertResultadoRequest(
    [Range(0, int.MaxValue)] int Aciertos,
    [Range(0, int.MaxValue)] int Errores,
    [Range(0, int.MaxValue)] int? TiempoSegundos,
    [StringLength(500)] string? Observaciones,
    IReadOnlyList<MetricaValorRequest>? Metricas
);
