using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public interface IResultadoRepository
    {
        Task<bool> SesionEjercicioPerteneceAsync(int sesionId, int ejercicioId, int psicopedagogoId, CancellationToken ct = default);
        Task<Resultado?> GetAsync(int sesionId, int ejercicioId, CancellationToken ct = default);
        Task<SesionEjercicio?> GetDetalleAsync(int sesionId, int ejercicioId, int psicopedagogoId, CancellationToken ct = default);
        Task<Resultado> UpsertAsync(Resultado resultado, CancellationToken ct = default);
    }
}
