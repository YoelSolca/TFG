using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class AuthService(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher passwordHasher,
        ITokenGenerator tokenGenerator,
        IEmailSender emailSender,
        ILogger<AuthService> logger
        ) : IAuthService
    {
        public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken ct)
        {
            var usuario = await usuarioRepository.GetByEmailAsync(request.CorreoElectronico.Trim().ToLowerInvariant(), ct);

            if(usuario == null || !passwordHasher.Verify(request.Contrasenia, usuario.Contrasenia))
                return Result<LoginResponse>.Failure("Correo electrónico o contraseña incorrectos.", ErrorCodes.InvalidCredentials);

            // El estado se revela recién con la contraseña correcta: así nadie averigua si un correo existe sin conocer la clave.
            if (usuario.Estado != EstadoCuenta.Aprobado)
            {
                logger.LogWarning("Login rechazado de {UsuarioId}: cuenta {Estado}.", usuario.PersonaId, usuario.Estado);
                return Result<LoginResponse>.Failure(await MensajeDeCuentaAsync(usuario, ct), CodigoDeCuenta(usuario.Estado));
            }

            var (token, expiresAt) = tokenGenerator.Generate(usuario);

            logger.LogInformation("Psicopedagogo{PsicopedagogoId} logueado ", usuario.PersonaId);

            return Result<LoginResponse>.Success(new LoginResponse(token, expiresAt, usuario.PersonaId, usuario.Persona.Nombre + " " + usuario.Persona.Apellido, usuario.Estado, usuario.Rol));
        }

        private static string CodigoDeCuenta(EstadoCuenta estado) => estado switch
        {
            EstadoCuenta.Rechazado => ErrorCodes.AccountRejected,
            EstadoCuenta.Suspendido => ErrorCodes.AccountSuspended,
            _ => ErrorCodes.AccountPending,
        };

        // Lo que ve la persona al intentar entrar: qué pasó con su cuenta y, si el administrador lo escribió, por qué.
        private async Task<string> MensajeDeCuentaAsync(Usuario usuario, CancellationToken ct)
        {
            if (usuario.Estado == EstadoCuenta.Pendiente)
                return "Tu solicitud todavía está pendiente de aprobación. Te avisaremos cuando un administrador la revise.";

            var mensaje = usuario.Estado == EstadoCuenta.Rechazado
                ? "Tu solicitud de registro fue rechazada."
                : "Tu cuenta está suspendida.";
            var motivo = await usuarioRepository.GetUltimoMotivoAsync(usuario.PersonaId, usuario.Estado, ct);
            return string.IsNullOrWhiteSpace(motivo) ? mensaje : $"{mensaje} Motivo: {motivo.Trim()}";
        }

        public async Task ForgotPasswordAsync(string correoElectronico, CancellationToken ct = default)
        {
            var existing = await usuarioRepository.GetByEmailAsync(correoElectronico.Trim().ToLowerInvariant(), ct);

            // Si el correo no existe no se hace nada y se responde igual que si existiera,
            // para que no se pueda averiguar qué correos están registrados.
            if (existing == null)
            {
                logger.LogInformation("Se pidió recuperar la contraseña de un correo que no está registrado.");
                return;
            }

            var (token, expiresAt) = tokenGenerator.GenerateResetToken();

            // En la base queda el hash; el token en sí solo viaja en el correo.
            await usuarioRepository.UpdateUsuariopAsync(existing.PersonaId, ResetTokenHash.Compute(token), expiresAt, ct);

            try
            {
                await emailSender.SendPasswordResetAsync(existing.CorreoElectronico, existing.Persona.Nombre, token, expiresAt, ct);
                logger.LogInformation("Se envió el correo de recuperación de contraseña al usuario {UsuarioId}", existing.PersonaId);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Si fallara el envío y se respondiera con error, quedaría claro que el correo existe.
                logger.LogError(ex, "No se pudo enviar el correo de recuperación al usuario {UsuarioId}", existing.PersonaId);
            }
        }

        public async Task<Result<bool>> ResetPasswordAsync(string token, string nuevaContrasenia, CancellationToken ct = default)
        {
            var restablecida = await usuarioRepository.ValidatePasswordResetTokenAsync(ResetTokenHash.Compute(token), nuevaContrasenia, ct);

            return restablecida
                ? Result<bool>.Success(true)
                : Result<bool>.Failure("El enlace no es válido o ya venció. Pedí uno nuevo.", ErrorCodes.InvalidToken);
        }
    }
}
