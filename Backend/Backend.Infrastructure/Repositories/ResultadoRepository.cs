using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class ResultadoRepository(AppDbContext context) : IResultadoRepository
    {
        public Task<bool> SesionEjercicioPerteneceAsync(int sesionId, int ejercicioId, int psicopedagogoId, CancellationToken ct = default)
            => context.Set<SesionEjercicio>().AnyAsync(
                se => se.SesionId == sesionId && se.EjercicioId == ejercicioId && se.Sesion.PsicopedagogoId == psicopedagogoId, ct);

        public Task<Resultado?> GetAsync(int sesionId, int ejercicioId, CancellationToken ct = default)
            => context.Resultado.AsNoTracking()
                .Include(r => r.ResultadoMetricas).ThenInclude(rm => rm.Metrica)
                .FirstOrDefaultAsync(r => r.SesionId == sesionId && r.EjercicioId == ejercicioId, ct);

        public Task<SesionEjercicio?> GetDetalleAsync(int sesionId, int ejercicioId, int psicopedagogoId, CancellationToken ct = default)
            => context.SesionEjercicio.AsNoTracking()
                .Include(se => se.Ejercicio).ThenInclude(e => e.TipoEjercicio)
                .Include(se => se.Sesion).ThenInclude(s => s.PsicopedagogoPaciente).ThenInclude(pp => pp.Paciente).ThenInclude(p => p.Persona)
                .Include(se => se.Resultado).ThenInclude(r => r!.ResultadoMetricas).ThenInclude(rm => rm.Metrica)
                .FirstOrDefaultAsync(se => se.SesionId == sesionId && se.EjercicioId == ejercicioId && se.Sesion.PsicopedagogoId == psicopedagogoId, ct);

        // Con sus métricas y seguido por Entity Framework: la entidad decide qué cambia y después se guarda.
        public Task<Resultado?> GetForUpdateAsync(int sesionId, int ejercicioId, CancellationToken ct = default)
            => context.Resultado
                .Include(r => r.ResultadoMetricas)
                .FirstOrDefaultAsync(r => r.SesionId == sesionId && r.EjercicioId == ejercicioId, ct);

        public async Task AddAsync(Resultado resultado, CancellationToken ct = default)
        {
            context.Resultado.Add(resultado);
            await context.SaveChangesAsync(ct);
        }

        public Task SaveChangesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
    }
}
