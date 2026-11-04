using Backend.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTO;

public record SesionDto(int Id, int PacienteId, int PsicopedagogoId, DateTime Fecha, IReadOnlyList<int> EjercicioIds)
{
    public static SesionDto FromEntity(Sesion s) => new(
        s.Id, s.PacienteId, s.PsicopedagogoId, s.Fecha, s.SesionEjercicios.Select(se => se.EjercicioId).ToList());
}

public record SesionListItemDto(int Id, int PacienteId, string Nombre, string Apellido, DateTime Fecha, string? Objetivo)
{
    public static SesionListItemDto FromEntity(Sesion s) => new(
        s.Id, s.PacienteId,
        s.PsicopedagogoPaciente.Paciente.Persona.Nombre,
        s.PsicopedagogoPaciente.Paciente.Persona.Apellido,
        s.Fecha,
        s.PsicopedagogoPaciente.Intervencion.objetivo);
}

public record SesionEjercicioItemDto(int EjercicioId, string Ejercicio, string TipoEjercicio, string Icono, int Orden, int? TiempoSegundos)
{
    public static SesionEjercicioItemDto FromEntity(SesionEjercicio se) => new(
        se.EjercicioId,
        se.Ejercicio.Nombre,
        se.Ejercicio.TipoEjercicio.Nombre,
        se.Ejercicio.TipoEjercicio.icono,
        se.Orden,
        se.Resultado?.TiempoSegundos);
}

public record SesionEjerciciosCriteria(int Page = 1, int PageSize = 5);

public record CreateSesionRequest(
    [Required] int PacienteId,
    [Required] int PsicopedagogoId,
    [Required, MinLength(1)] IReadOnlyList<int> EjercicioIds
);


public record SesionSearchCriteria
(
    string? NombreApellido,
    int Page = 1,
    int PageSize = 3
);

public record UpsertSesionRequest(
  [Required, MinLength(1)] IReadOnlyList<int> EjercicioIds
);
