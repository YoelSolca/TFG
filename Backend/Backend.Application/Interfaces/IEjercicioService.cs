using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IEjercicioService 
    {
        Task<PagedResponse<EjercicioDto>> GetAllEjercicioAsync(EjercicioSearchCriteria criteria, CancellationToken ct = default);
        Task<Result<PagedResponse<EjercicioRealizadoItemDto>>> GetRealizadosAsync(EjercicioRealizadoSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default);
    }
}
