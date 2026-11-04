using Backend.Domain.Entities;

namespace Backend.Application.DTO;

public record EjercicioDto(int id, string nombre, string tipoEjercicio, string descripcion)
{
    public static EjercicioDto FromEntity(Ejercicio e) => new(e.Id, e.Nombre, e.TipoEjercicio.Nombre, e.Descripcion);
}




public record EjercicioSearchCriteria(
    int? tipoEjercicioId,
    int Page = 1,
    int PageSize = 6);


// Un ejercicio de una sesión que ya tiene resultado; Fecha es cuándo se registró ese resultado.
public record EjercicioRealizadoItemDto(
    int SesionId, int EjercicioId, int PacienteId,
    string Nombre, string Apellido,
    string Ejercicio, string TipoEjercicio,
    DateTime Fecha)
{
    public static EjercicioRealizadoItemDto FromEntity(SesionEjercicio se) => new(
        se.SesionId, se.EjercicioId, se.Sesion.PacienteId,
        se.Sesion.PsicopedagogoPaciente.Paciente.Persona.Nombre,
        se.Sesion.PsicopedagogoPaciente.Paciente.Persona.Apellido,
        se.Ejercicio.Nombre, se.Ejercicio.TipoEjercicio.Nombre,
        se.Resultado!.FechaRegistro);
}

public record EjercicioRealizadoSearchCriteria(
    string? NombreApellido,
    int? TipoEjercicioId,
    int Page = 1,
    int PageSize = 5);