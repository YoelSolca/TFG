using Backend.Domain.Entities;
using System.ComponentModel.DataAnnotations;


namespace Backend.Application.DTO;

public record PacienteDto(int personaId, string Direccion, DateTime FechaAlta)
{
    public static PacienteDto FromEntity(Paciente p) => new(p.PersonaId, p.Direccion, p.FechaAlta);
}

public record PacienteListItemDto(int Id, string Nombre, string Apellido, string Documento, DateOnly FechaNacimiento, IReadOnlyList<string> TiposDificultad);

public record TipoDificultadDto(int Id, string Nombre);

public record TipoEjercicioDto (int Id, string Nombre);

public record PacienteDetalleDto(
    int Id, string Nombre, string Apellido, string Documento, DateOnly FechaNacimiento,
    string Direccion, string Genero,
    string? Objetivo, string? Observaciones, IReadOnlyList<TipoDificultadDto> TiposDificultad, UltimaSesionDto? UltimaSesion);

public record PacienteHistorialItemDto(
    int SesionId, int EjercicioId, DateTime Fecha,
    string TipoEjercicio, string Ejercicio,
    int Aciertos, int Errores, int? TiempoSegundos,
    string? Observaciones,
    IReadOnlyList<MetricaValorDto> Metricas);

public record EjercicioSeguimientoDto(
    int EjercicioId, string Ejercicio, int TipoEjercicioId, string TipoEjercicio,
    int Aciertos, int Errores, string? Observaciones);

public record SesionSeguimientoDto(
    int SesionId, DateTime Fecha,
    IReadOnlyList<EjercicioSeguimientoDto> Ejercicios);

public record PacienteInformeItemDto(
    int Id, int PacienteId, DateTime FechaGeneracion, 
    int PsicopedagogoId,
     string contenido, DateTime PeriodoDesde, DateTime PeriodoHasta);
public record MetricaValorDto(string Nombre, decimal Valor, string? Unidad);


public record UltimaSesionDto(int Id, DateTime Fecha, IReadOnlyList<string> TiposEjercicio);

public record PagedResponse<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

public record RegistroPacienteResult(PacienteDto Paciente, bool Creado);

public record CreatePacienteRequest(
    [Required] int PsicopedagogoId,
    [Required, StringLength(50)] string Direccion,
    [Required, StringLength(100)] string Nombre,
    [StringLength(100)] string Apellido,
    [StringLength(20)] string Documento,
    [StringLength(1)] string Genero,
    DateOnly FechaNacimiento,
    DateTime FechaAlta,
    [StringLength(50)] string? Objetivo,
    [StringLength(100)] string? Observaciones,
    IReadOnlyList<int>? TiposDificultadIds
);
public record UpsertPacienteRequest(
    [Required, StringLength(50)] string Direccion,
    [Required, StringLength(100)] string Nombre,
    [StringLength(100)] string Apellido,
    [StringLength(20)] string Documento,
    [StringLength(1)] string Genero,
    DateOnly FechaNacimiento,
    [StringLength(50)] string? Objetivo,
    [StringLength(100)] string? Observaciones,
    [Required, MinLength(1)] IReadOnlyList<int> TiposDificultadIds
    );
