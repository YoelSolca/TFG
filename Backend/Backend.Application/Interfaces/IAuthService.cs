using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IAuthService
    {
        Task<Result<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default);
        // No devuelve resultado a propósito: la respuesta es la misma exista o no el correo.
        Task ForgotPasswordAsync(string correoElectronico, CancellationToken ct = default);
        Task<Result<bool>> ResetPasswordAsync(string token, string nuevaContrasenia, CancellationToken ct = default);
    }
}
