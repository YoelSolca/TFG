using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class UsuarioRepository(
        AppDbContext context,
        IPasswordHasher contraseniaHasher) : IUsuarioRepository
    {

        public async Task<Usuario?> GetByEmailAsync(string correoElectronico, CancellationToken ct = default)
         => await context.Usuario.AsNoTracking()
            .Include(x => x.Persona)
            .FirstOrDefaultAsync(u => u.CorreoElectronico == correoElectronico, ct);

        public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
        => await context.Usuario.AsNoTracking().AnyAsync(u => u.CorreoElectronico == email, ct);

        public async Task<bool> EstaHabilitadaAsync(int usuarioId, CancellationToken ct = default)
        => await context.Usuario.AsNoTracking().AnyAsync(u => u.PersonaId == usuarioId && u.Estado == EstadoCuenta.Aprobado, ct);

        public async Task<string?> GetUltimoMotivoAsync(int usuarioId, EstadoCuenta estado, CancellationToken ct = default)
        => await context.Usuario.AsNoTracking()
            .Where(u => u.PersonaId == usuarioId)
            .SelectMany(u => u.Historial)
            .Where(h => h.EstadoNuevo == estado)
            .OrderByDescending(h => h.Fecha)
            .Select(h => h.Motivo)
            .FirstOrDefaultAsync(ct);

        public async Task UpdateUsuariopAsync(int psicopedagogoId, string tokenHash, DateTime ExpiresAt, CancellationToken ct = default)
        {
            var existingPsicopedagogo = await context.Usuario.FirstOrDefaultAsync(p => p.PersonaId == psicopedagogoId, ct);

            if (existingPsicopedagogo == null) return;

            existingPsicopedagogo.GuardarTokenDeRestablecimiento(tokenHash, ExpiresAt);

            await context.SaveChangesAsync(ct);
        }

        public async Task<bool> ValidatePasswordResetTokenAsync(string tokenHash, string nuevaContrasenia, CancellationToken ct = default)
        {
            var existingUsuario = await
                   context.Usuario
                   .FirstOrDefaultAsync(u => u.TokenRestablecimiento == tokenHash && u.FechaExpiracionTokenRestablecimiento > DateTime.Now, ct);

            if (existingUsuario == null) return false;

            existingUsuario.RestablecerContrasenia(contraseniaHasher.Hash(nuevaContrasenia), DateTime.Now);

            await context.SaveChangesAsync(ct);
            return true;
        }
    }
}
