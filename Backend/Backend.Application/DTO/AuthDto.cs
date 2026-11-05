using Backend.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.Application.DTO;

public record AuthDto(int PersonaId, string CorreoElectronico, string Contrasenia, string? TokenRestablecimiento, DateTime FechaExpiracionTokenRestablecimiento, DateTime FechaRecuperacion)
{
    public static AuthDto FromEntity(Usuario u) => new(u.PersonaId, u.CorreoElectronico, u.Contrasenia, u.TokenRestablecimiento, u.FechaExpiracionTokenRestablecimiento, u.FechaRecuperacion);
}

public record LoginRequest(
    [Required, EmailAddress] string CorreoElectronico,
    [Required] string Contrasenia);


public static class ReglasContrasenia
{
    public const string Patron = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$";
    public const string Mensaje = "La contraseña debe tener al menos 8 caracteres, con al menos una mayúscula, una minúscula, un número y un carácter especial.";
}

public record ResetPassword(
    [Required] string Token,
    [Required, RegularExpression(ReglasContrasenia.Patron, ErrorMessage = ReglasContrasenia.Mensaje)] string NuevaContrasenia);


public record LoginResponse(string Token, DateTime ExpiresAt, int PsicopedagogoId, string PsicopedagogoName, EstadoCuenta Estado, [property: JsonConverter(typeof(JsonStringEnumConverter))] RolUsuario Rol);


