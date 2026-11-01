using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Interfaces;

namespace Backend.Application.Services
{
    public class MetricaService(IMetricaRepository metricaRepository) : IMetricaService
    {
        public async Task<IReadOnlyList<MetricaDto>> GetAllAsync(CancellationToken ct = default)
        {
            var metricas = await metricaRepository.GetAllAsync(ct);
            return metricas.Select(MetricaDto.FromEntity).ToList();
        }
    }
}
