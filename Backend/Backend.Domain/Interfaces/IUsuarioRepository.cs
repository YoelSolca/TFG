using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<Usuario?> GetByEmailAsync(string email, CancellationToken ct = default);
        Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
        // True si la cuenta existe y está aprobada: se consulta en cada pedido para que suspender corte el acceso de inmediato.
        Task<bool> EstaHabilitadaAsync(int usuarioId, CancellationToken ct = default);
        // Lo que escribió el administrador la última vez que dejó la cuenta en ese estado (rechazada, suspendida); null si no escribió nada.
        Task<string?> GetUltimoMotivoAsync(int usuarioId, EstadoCuenta estado, CancellationToken ct = default);
        Task UpdateUsuariopAsync(int PsicopedagogoId, string tokenHash, DateTime ExpiresAt, CancellationToken ct = default);
        // Devuelve false si el token no existe o ya venció; en ese caso no cambia nada.
        Task<bool> ValidatePasswordResetTokenAsync(string tokenHash, string nuevaContrasenia, CancellationToken ct = default);    }
}
