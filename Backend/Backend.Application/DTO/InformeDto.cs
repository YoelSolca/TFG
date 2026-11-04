using System.ComponentModel.DataAnnotations;
using Backend.Domain.Entities;

namespace Backend.Application.DTO;

public record InformeDto(
    int Id,
    int PacienteId,
    int PsicopedagogoId,
    DateTime FechaGeneracion,
    DateTime PeriodoDesde,
    DateTime PeriodoHasta,
    string Contenido)
{
    public static InformeDto FromEntity(Informe i) => new(
        i.Id, i.PacienteId, i.PsicopedagogoId, i.FechaGeneracion, i.PeriodoDesde, i.PeriodoHasta, i.Contenido);
}

// Fila del listado general: sin el Contenido completo, solo el resumen.
public record InformeListItemDto(
    int Id,
    int PacienteId,
    string Nombre,
    string Apellido,
    DateTime FechaGeneracion,
    DateTime PeriodoDesde,
    DateTime PeriodoHasta,
    string Resumen)
{
    public static InformeListItemDto FromEntity(Informe i) => new(
        i.Id, i.PacienteId, i.Paciente.Persona.Nombre, i.Paciente.Persona.Apellido,
        i.FechaGeneracion, i.PeriodoDesde, i.PeriodoHasta, i.Resumen);
}

// Detalle del informe: incluye los datos del paciente que se muestran en la cabecera.
public record InformeDetalleDto(
    int Id,
    int PacienteId,
    string Nombre,
    string Apellido,
    string Documento,
    DateOnly? FechaNacimiento,
    DateTime FechaGeneracion,
    DateTime PeriodoDesde,
    DateTime PeriodoHasta,
    string Contenido)
{
    public static InformeDetalleDto FromEntity(Informe i) => new(
        i.Id, i.PacienteId, i.Paciente.Persona.Nombre, i.Paciente.Persona.Apellido,
        i.Paciente.Persona.Documento, i.Paciente.Persona.FechaNacimiento,
        i.FechaGeneracion, i.PeriodoDesde, i.PeriodoHasta, i.Contenido);
}

public record InformeSearchCriteria(string? NombreApellido, int Page = 1, int PageSize = 5);

public record CreateInformeRequest(
    [Required] int PsicopedagogoId,
    [Required] DateTime PeriodoDesde,
    [Required] DateTime PeriodoHasta
);
