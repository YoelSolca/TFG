using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IResultadoService
    {
        Task<Result<ResultadoDetalleDto>> GetAsync(int sesionId, int ejercicioId, CancellationToken ct = default);
        Task<Result<ResultadoDto>> UpsertAsync(int sesionId, int ejercicioId, UpsertResultadoRequest request, CancellationToken ct = default);
    }
}
