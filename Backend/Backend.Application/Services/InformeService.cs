using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;

namespace Backend.Application.Services
{
    public class InformeService(IInformeRepository repository, IUsuarioActual usuarioActual) : IInformeService
    {
        private const int MaxPageSize = 50;

        public async Task<Result<PagedResponse<InformeListItemDto>>> GetAllAsync(InformeSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default)
        {
            var page = Math.Max(criteria.Page, 1);
            var pageSize = Math.Clamp(criteria.PageSize, 1, MaxPageSize);

            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<PagedResponse<InformeListItemDto>>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var (items, total) = await repository.GetAllAsync(psicopedagogoId, criteria.NombreApellido, fecha, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<InformeListItemDto>>.Success(
                new PagedResponse<InformeListItemDto>(items.Select(InformeListItemDto.FromEntity).ToList(), total, page, pageSize));
        }

        public async Task<Result<InformeDetalleDto>> GetByIdAsync(int id, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<InformeDetalleDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            // Un informe de otro profesional se informa como inexistente, para no revelar que existe.
            var informe = await repository.GetByIdAsync(id, psicopedagogoId, ct);
            return informe is null
                ? Result<InformeDetalleDto>.Failure("El informe no existe.", ErrorCodes.NotFound)
                : Result<InformeDetalleDto>.Success(InformeDetalleDto.FromEntity(informe));
        }

        public async Task<Result<InformeDto>> CreateAsync(int pacienteId, CreateInformeRequest request, CancellationToken ct = default)
        {
            if (!await repository.PacientePerteneceAsync(pacienteId, request.PsicopedagogoId, ct))
            {
                return Result<InformeDto>.Failure(
                    $"El psicopedagogo {request.PsicopedagogoId} no atiende al paciente {pacienteId}.", ErrorCodes.Forbidden);
            }

            // TODO: reemplazar por la generación real con IA (paso siguiente, no incluido en esta etapa).
            var contenido = $"Informe generado automáticamente para el período {request.PeriodoDesde:d} - {request.PeriodoHasta:d}.";

            var informe = new Informe
            {
                PacienteId = pacienteId,
                PsicopedagogoId = request.PsicopedagogoId,
                FechaGeneracion = DateTime.Now,
                PeriodoDesde = request.PeriodoDesde,
                PeriodoHasta = request.PeriodoHasta,
                Contenido = contenido
            };

            var creado = await repository.AddAsync(informe, ct);
            return Result<InformeDto>.Success(InformeDto.FromEntity(creado));
        }
    }
}
