using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IPsicopedagogoService
    {
        Task<PagedResponse<PsicopedagogoDto>> GetPsicopedagogosAsync(PsicopedagogoSearchCriteria criteria, CancellationToken ct = default);
        Task<Result<PsicopedagogoDto>> CreatepsicopedagogoAsync(CreatePsicopedagogoRequest request, CancellationToken ct = default);
        Task<Result<PsicopedagogoDto>> GetByPsicopedagogoIdAsync(int psicopedagogoId, CancellationToken ct = default);
        // Perfil del psicopedagogo logueado: el id sale del token.
        Task<Result<PerfilDto>> GetPerfilAsync(CancellationToken ct = default);
        Task<Result<PerfilDto>> UpdatePerfilAsync(UpdatePerfilRequest request, CancellationToken ct = default);
        Task<Result<bool>> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default);

        Task<Result<PsicopedagogoDto>> UpdateStateAsync(int psicopedagogoId, UpdateStateRequest request, CancellationToken ct = default);

    }
}
