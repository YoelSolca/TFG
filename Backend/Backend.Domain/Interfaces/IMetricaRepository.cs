using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public interface IMetricaRepository
    {
        Task<IReadOnlyList<Metrica>> GetAllAsync(CancellationToken ct = default);
        Task<IReadOnlyList<int>> GetExistingIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);
    }
}
