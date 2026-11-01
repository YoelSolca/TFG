using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IMetricaService
    {
        // Catálogo completo (es chico y fijo): sirve para armar el formulario de resultado.
        Task<IReadOnlyList<MetricaDto>> GetAllAsync(CancellationToken ct = default);
    }
}
