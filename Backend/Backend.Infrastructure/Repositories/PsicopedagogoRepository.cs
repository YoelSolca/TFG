using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class PsicopedagogoRepository(AppDbContext context) : IPsicopedagogoRepository
    {
        public async Task<Psicopedagogo> AddPsicopedagogoAsync(Psicopedagogo psicopedagogo, CancellationToken ct = default)
        {
            context.Psicopedagogo.Add(psicopedagogo);
            await context.SaveChangesAsync(ct);
            return psicopedagogo;
        }

        public async Task<(IReadOnlyList<Psicopedagogo> Items, int TotalCount)> GetAllPsicopedagogosAsync(PsicopedagogoSearchFilter filter, int skip, int take, CancellationToken ct = default)
        {
            var query = context.Psicopedagogo.AsNoTracking()
                                 .Include(p => p.Persona).ThenInclude(p => p.Usuario)
                                 .AsQueryable();

            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                var term = $"%{filter.SearchTerm.Trim()}%";
                query = query.Where(p => EF.Functions.Like(p.Matricula, term) ||
                                         EF.Functions.Like(p.Persona.Nombre, term) ||
                                         EF.Functions.Like(p.Persona.Apellido, term) ||
                                         EF.Functions.Like(p.Persona.Usuario.CorreoElectronico, term) ||
                                         EF.Functions.Like(p.Persona.Documento, term));
            }

            if (filter.Estado is { Length: > 0 })
                query = query.Where(p => filter.Estado.Contains(p.Persona.Usuario.Estado));

            var total = await query.CountAsync(ct);

            var items = await query.OrderBy(p => p.Persona.Nombre)
                               .ThenBy(p => p.PersonaId)
                               .Skip(skip)
                               .Take(take)
                               .ToListAsync(ct);

            return (items, total);
        }

        public Task<Psicopedagogo?> GetByPsicopedagogoIdAsync(int psicopedagogoId, CancellationToken ct = default)
            => context.Psicopedagogo.AsNoTracking().Include(p => p.Persona).ThenInclude(p => p.Usuario).FirstOrDefaultAsync(p => p.PersonaId == psicopedagogoId, ct);

        public Task<bool> EmailTakenByOtherAsync(int personaId, string correoElectronico, CancellationToken ct = default)
            => context.Usuario.AsNoTracking().AnyAsync(u => u.CorreoElectronico == correoElectronico && u.PersonaId != personaId, ct);

        public Task<bool> DocumentoTakenByOtherAsync(int personaId, string documento, CancellationToken ct = default)
            => context.Persona.AsNoTracking().AnyAsync(p => p.Documento == documento && p.Id != personaId, ct);

        public async Task<IReadOnlyDictionary<int, ActividadPsicopedagogo>> GetActividadAsync(IReadOnlyCollection<int> psicopedagogoIds, CancellationToken ct = default)
        {
            // Pacientes que atiende hoy (el vínculo sigue abierto mientras no tenga fecha de fin).
            var pacientes = await context.PsicopedagogoPaciente.AsNoTracking()
                .Where(pp => psicopedagogoIds.Contains(pp.PsicopedagogoId) && pp.FechaFin == null)
                .GroupBy(pp => pp.PsicopedagogoId)
                .Select(g => new { Id = g.Key, Cantidad = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Cantidad, ct);

            // Última sesión que realmente se hizo (las planificadas todavía no cuentan).
            var ultimas = await context.Sesion.AsNoTracking()
                .Where(s => psicopedagogoIds.Contains(s.PsicopedagogoId) && s.Estado != EstadoSesion.Planificada)
                .GroupBy(s => s.PsicopedagogoId)
                .Select(g => new { Id = g.Key, Fecha = g.Max(s => s.Fecha) })
                .ToDictionaryAsync(x => x.Id, x => x.Fecha, ct);

            var usuarios = await context.Usuario.AsNoTracking()
                .Where(u => psicopedagogoIds.Contains(u.PersonaId))
                .Select(u => new { u.PersonaId, u.Estado })
                .ToListAsync(ct);

            var historial = await context.HistorialEstadoCuenta.AsNoTracking()
                .Where(h => psicopedagogoIds.Contains(h.UsuarioId))
                .Select(h => new { h.UsuarioId, h.EstadoNuevo, h.Motivo, h.Fecha })
                .ToListAsync(ct);

            var resultado = new Dictionary<int, ActividadPsicopedagogo>();
            foreach (var u in usuarios)
            {
                var propio = historial.Where(h => h.UsuarioId == u.PersonaId).OrderByDescending(h => h.Fecha).ToList();
                var aprobacion = propio.FirstOrDefault(h => h.EstadoNuevo == EstadoCuenta.Aprobado)?.Fecha;
                // El motivo que se muestra es el del estado actual (por qué está rechazada o suspendida).
                var motivo = u.Estado is EstadoCuenta.Rechazado or EstadoCuenta.Suspendido
                    ? propio.FirstOrDefault(h => h.EstadoNuevo == u.Estado)?.Motivo
                    : null;

                resultado[u.PersonaId] = new ActividadPsicopedagogo(
                    pacientes.GetValueOrDefault(u.PersonaId),
                    ultimas.TryGetValue(u.PersonaId, out var ultima) ? ultima : null,
                    aprobacion,
                    motivo);
            }
            return resultado;
        }

        public Task<bool> MatriculaTakenAsync(string matricula, CancellationToken ct = default)
            => context.Psicopedagogo.AsNoTracking().AnyAsync(p => p.Matricula == matricula, ct);

        public Task<Psicopedagogo?> GetForUpdateAsync(int psicopedagogoId, CancellationToken ct = default)
            => context.Psicopedagogo.Include(p => p.Persona).ThenInclude(p => p.Usuario).FirstOrDefaultAsync(p => p.PersonaId == psicopedagogoId, ct);

        public Task SaveChangesAsync(CancellationToken ct = default)
            => context.SaveChangesAsync(ct);
    }
}
