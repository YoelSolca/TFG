using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;

namespace Backend.Application.Services
{
    public class EjercicioService(
            IEjercicioRepository ejercicioRepository,
            IUsuarioActual usuarioActual
        ) : IEjercicioService
    {
        private const int MaxPageSize = 50;

        public async Task<PagedResponse<EjercicioDto>> GetAllEjercicioAsync(EjercicioSearchCriteria criteria, CancellationToken ct = default)
        {
            var page = Math.Max(criteria.Page, 1);
            var pageSize = Math.Clamp(criteria.PageSize, 1, MaxPageSize);


            var (items, total) = await ejercicioRepository.GetAllEjercicioAsync(new EjercicioSearchFilter(criteria.tipoEjercicioId),
                (page - 1) * pageSize, pageSize, ct);

            return new PagedResponse<EjercicioDto>(items.Select(EjercicioDto.FromEntity).ToList(), total, page, pageSize);
        }

        public async Task<Result<PagedResponse<EjercicioRealizadoItemDto>>> GetRealizadosAsync(EjercicioRealizadoSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default)
        {
            var page = Math.Max(criteria.Page, 1);
            var pageSize = Math.Clamp(criteria.PageSize, 1, MaxPageSize);

            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<PagedResponse<EjercicioRealizadoItemDto>>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var (items, total) = await ejercicioRepository.GetRealizadosAsync(psicopedagogoId, criteria.NombreApellido, criteria.TipoEjercicioId, fecha, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<EjercicioRealizadoItemDto>>.Success(
                new PagedResponse<EjercicioRealizadoItemDto>(items.Select(EjercicioRealizadoItemDto.FromEntity).ToList(), total, page, pageSize));
        }

    }
}
