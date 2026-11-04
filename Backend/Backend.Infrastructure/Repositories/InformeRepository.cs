using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class InformeRepository(AppDbContext context) : IInformeRepository
    {
        public Task<bool> PacientePerteneceAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
            => context.Set<PsicopedagogoPaciente>().AnyAsync(
                pp => pp.PacienteId == pacienteId && pp.PsicopedagogoId == psicopedagogoId, ct);

        public async Task<(IReadOnlyList<Informe> Items, int TotalCount)> GetAllAsync(
            int psicopedagogoId, string? nombreApellido, DateTime? fecha,
            int skip, int take, CancellationToken ct = default)
        {
            var query = context.Informe.AsNoTracking()
                .Where(i => i.PsicopedagogoId == psicopedagogoId);

            if (!string.IsNullOrWhiteSpace(nombreApellido))
            {
                // "Juan Perez": cada palabra tiene que coincidir con el nombre o con el apellido
                foreach (var palabra in nombreApellido.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    var term = palabra;
                    query = query.Where(i => i.Paciente.Persona.Nombre.Contains(term)
                                          || i.Paciente.Persona.Apellido.Contains(term));
                }
            }

            if (fecha is DateTime f)
            {
                var dia = f.Date;
                query = query.Where(i => i.FechaGeneracion >= dia && i.FechaGeneracion < dia.AddDays(1));
            }

            var total = await query.CountAsync(ct);

            var items = await query
                .Include(i => i.Paciente).ThenInclude(p => p.Persona)
                .OrderByDescending(i => i.FechaGeneracion)
                .ThenByDescending(i => i.Id)
                .Skip(skip).Take(take)
                .ToListAsync(ct);

            return (items, total);
        }

        public Task<Informe?> GetByIdAsync(int id, int psicopedagogoId, CancellationToken ct = default)
            => context.Informe.AsNoTracking()
                .Include(i => i.Paciente).ThenInclude(p => p.Persona)
                .FirstOrDefaultAsync(i => i.Id == id && i.PsicopedagogoId == psicopedagogoId, ct);

        public async Task<Informe> AddAsync(Informe informe, CancellationToken ct = default)
        {
            context.Informe.Add(informe);
            await context.SaveChangesAsync(ct);
            return informe;
        }
    }
}
