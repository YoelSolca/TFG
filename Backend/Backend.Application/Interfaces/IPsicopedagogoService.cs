using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IPsicopedagogoService
    {
        Task<PagedResponse<PsicopedagogoDto>> GetPsicopedagogosAsync(PsicopedagogoSearchCriteria criteria, CancellationToken ct = default);
        Task<Result<PsicopedagogoDto>> CreatepsicopedagogoAsync(CreatePsicopedagogoRequest request, CancellationToken ct = default);
        Task<Result<PsicopedagogoDto>> GetByPsicopedagogoIdAsync(int psicopedagogoId, CancellationToken ct = default);
        Task<Result<PsicopedagogoDto>> UpdateAsync(int psicopedagogoId, UpsertPsicopedagogoRequest request, CancellationToken ct = default);

        Task<Result<PsicopedagogoDto>> UpdateStateAsync(int psicopedagogoId, UpdateStateRequest request, CancellationToken ct = default);

    }
}
