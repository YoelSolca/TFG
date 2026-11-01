using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class MetricaRepository(AppDbContext context) : IMetricaRepository
    {
        public async Task<IReadOnlyList<Metrica>> GetAllAsync(CancellationToken ct = default)
            => await context.Metrica.AsNoTracking().OrderBy(m => m.Id).ToListAsync(ct);

        public async Task<IReadOnlyList<int>> GetExistingIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
            => await context.Metrica.Where(m => ids.Contains(m.Id)).Select(m => m.Id).ToListAsync(ct);
    }
}
