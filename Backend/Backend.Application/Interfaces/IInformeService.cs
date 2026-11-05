using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IInformeService
    {
        Task<Result<PagedResponse<InformeListItemDto>>> GetAllAsync(InformeSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default);
        Task<Result<InformeDetalleDto>> GetByIdAsync(int id, CancellationToken ct = default);
        Task<Result<InformeDto>> CreateAsync(int pacienteId, CreateInformeRequest request, CancellationToken ct = default);
    }
}
