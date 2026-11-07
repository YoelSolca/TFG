using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Backend.Application.DTO;

// Además de los datos para verificar la matrícula (documento, teléfono, nacimiento), trae lo que el administrador mira
// antes de decidir: cuándo se aprobó, cuántos pacientes atiende, su última sesión y el motivo si está rechazada o suspendida.
public record PsicopedagogoDto(
    int PersonaId, string CorreoElectronico, string? Avatar, string Matricula, string Nombre, string Apellido,
    DateTime FechaSolicitud, [property: JsonConverter(typeof(JsonStringEnumConverter))] EstadoCuenta Estado,
    string Documento, string Telefono, string? Genero, DateOnly? FechaNacimiento,
    DateTime? FechaAprobacion, int PacientesActivos, DateTime? UltimaActividad, string? Motivo)
{
    public static PsicopedagogoDto FromEntity(Psicopedagogo p, ActividadPsicopedagogo? actividad = null) => new(
        p.PersonaId, p.Persona.Usuario.CorreoElectronico, p.Avatar, p.Matricula, p.Persona.Nombre, p.Persona.Apellido,
        p.Persona.Usuario.FechaSolicitud, p.Persona.Usuario.Estado,
        p.Persona.Documento, p.Telefono, p.Persona.Genero, p.Persona.FechaNacimiento,
        actividad?.FechaAprobacion, actividad?.PacientesActivos ?? 0, actividad?.UltimaActividad, actividad?.Motivo);
}

public record CreatePsicopedagogoRequest(
    [Required, StringLength(50)] string CorreoElectronico,
    [Required, RegularExpression(ReglasContrasenia.Patron, ErrorMessage = ReglasContrasenia.Mensaje)] string Contrasenia,
    [Required, StringLength(100)] string Nombre,
    [StringLength(100)] string Apellido,
    [StringLength(20)] string Telefono,
    [Required, StringLength(100)] string Direccion,
    [StringLength(20)] string Documento,
    [StringLength(1)] string Genero,
    [Required] string Matricula,
    [Required] bool AceptoTerminos,
    DateOnly FechaNacimiento,
    DateTime FechaAlta
);

// Lo que muestra la pantalla de perfil: los datos personales y de la cuenta del psicopedagogo logueado.
public record PerfilDto(
    int PersonaId, string Nombre, string Apellido, string Documento, string Telefono, string Direccion,
    string? Genero, DateOnly? FechaNacimiento, string CorreoElectronico, string Matricula, string? Avatar,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] EstadoCuenta Estado)
{
    public static PerfilDto FromEntity(Psicopedagogo p) => new(
        p.PersonaId, p.Persona.Nombre, p.Persona.Apellido, p.Persona.Documento, p.Telefono, p.Direccion,
        p.Persona.Genero, p.Persona.FechaNacimiento, p.Persona.Usuario.CorreoElectronico, p.Matricula, p.Avatar,
        p.Persona.Usuario.Estado);
}

// La matrícula no se puede cambiar desde acá. ContraseniaActual solo hace falta si se cambia el correo.
public record UpdatePerfilRequest(
    [Required, StringLength(100)] string Nombre,
    [Required, StringLength(100)] string Apellido,
    [Required, RegularExpression(@"^\d{6,9}$", ErrorMessage = "El documento debe tener entre 6 y 9 dígitos.")] string Documento,
    [Required, RegularExpression(@"^[\d\s-]{8,20}$", ErrorMessage = "Teléfono inválido.")] string Telefono,
    [Required, StringLength(100)] string Direccion,
    [Required, RegularExpression("^[FMO]$", ErrorMessage = "El género debe ser F, M u O.")] string Genero,
    [Required] DateOnly FechaNacimiento,
    [Required, EmailAddress, StringLength(50)] string CorreoElectronico,
    string? ContraseniaActual
);

public record ChangePasswordRequest(
    [Required] string ContraseniaActual,
    [Required, RegularExpression(ReglasContrasenia.Patron, ErrorMessage = ReglasContrasenia.Mensaje)] string NuevaContrasenia
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