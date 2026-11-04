using Backend.Domain.Entities;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Backend.Application.DTO;

public record PsicopedagogoDto(int PersonaId, string CorreoElectronico, string? Avatar, string Matricula, string Nombre, string Apellido, DateTime FechaSolicitud, [property: JsonConverter(typeof(JsonStringEnumConverter))] EstadoCuenta Estado)
{
    public static PsicopedagogoDto FromEntity(Psicopedagogo p) => new(p.PersonaId, p.Persona.Usuario.CorreoElectronico, p.Avatar, p.Matricula, p.Persona.Nombre, p.Persona.Apellido, p.Persona.Usuario.FechaSolicitud, p.Persona.Usuario.Estado);
}

public record CreatePsicopedagogoRequest(
    [Required, StringLength(50)] string CorreoElectronico,
    [Required, RegularExpression(ReglasContrasenia.Patron, ErrorMessage = ReglasContrasenia.Mensaje)] string Contrasenia,
    [Required, StringLength(100)] string Nombre,
    [StringLength(100)] string Apellido,
    [StringLength(20)] string Telefono,
    [StringLength(20)] string Documento,
    [StringLength(1)] string Genero,
    [Required] string Matricula,
    [Required] bool AceptoTerminos,
    DateOnly FechaNacimiento,
    DateTime FechaAlta
);

public record UpsertPsicopedagogoRequest(
    [Required, StringLength(50)] string CorreoElectronico,
    [Required, StringLength(16)] string Contrasenia,
    [StringLength(250)]string? Avatar
);


public record UpdateStateRequest(
    [property: JsonConverter(typeof(JsonStringEnumConverter))] EstadoCuenta Estado,
    string? Motivo
);


public record PsicopedagogoSearchCriteria(
    string? SearchTerm,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] EstadoCuenta[]? Estado,
    int Page = 1,
    int PageSize = 6
);