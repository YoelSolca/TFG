using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface ISesionService
    {
        Task<Result<PagedResponse<SesionListItemDto>>> GetAllAsync(SesionSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default);
        Task<Result<SesionListItemDto>> GetByIdAsync(int id, CancellationToken ct = default);
        Task<Result<PagedResponse<SesionEjercicioItemDto>>> GetEjerciciosAsync(int id, SesionEjerciciosCriteria criteria, CancellationToken ct = default);
        Task<Result<SesionDto>> AddAsync(CreateSesionRequest sesion, CancellationToken ct = default);
        Task<Result<SesionDto>> UpdateAsync(int id, int psicopedagogoId, UpsertSesionRequest sesion, CancellationToken ct = default);
    }
}
