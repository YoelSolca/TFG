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

        public Task<Psicopedagogo?> GetForUpdateAsync(int psicopedagogoId, CancellationToken ct = default)
            => context.Psicopedagogo.Include(p => p.Persona).ThenInclude(p => p.Usuario).FirstOrDefaultAsync(p => p.PersonaId == psicopedagogoId, ct);

        public Task SaveChangesAsync(CancellationToken ct = default)
            => context.SaveChangesAsync(ct);
    }
}
