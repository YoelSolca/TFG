using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class SesionService(
        ISesionRepository sesionRepository,
        IPacienteRepository pacienteRepository,
        IEjercicioRepository ejercicioRepository,
        ILogger<SesionService> logger,
        IUsuarioActual usuarioActual
        ) : ISesionService
    {

        private const int MaxPageSize = 50;

        public async Task<Result<PagedResponse<SesionListItemDto>>> GetAllAsync(SesionSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default)
        {
            var page = Math.Max(criteria.Page, 1);
            var pageSize = Math.Clamp(criteria.PageSize, 1, MaxPageSize);

            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<PagedResponse<SesionListItemDto>>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var (items, total) = await sesionRepository.GetAllAsync(psicopedagogoId, criteria.NombreApellido, criteria.Estado, fecha, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<SesionListItemDto>>.Success(new PagedResponse<SesionListItemDto>(items.Select(SesionListItemDto.FromEntity).ToList(), total, page, pageSize));
        }

        public async Task<Result<SesionListItemDto>> GetByIdAsync(int id, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<SesionListItemDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var sesion = await sesionRepository.GetByIdAsync(id, psicopedagogoId, ct);

            return sesion is null
                ? Result<SesionListItemDto>.Failure($"La sesión con ID {id} no fue encontrada.", ErrorCodes.NotFound)
                : Result<SesionListItemDto>.Success(SesionListItemDto.FromEntity(sesion));
        }

        public async Task<Result<PagedResponse<SesionEjercicioItemDto>>> GetEjerciciosAsync(int id, SesionEjerciciosCriteria criteria, CancellationToken ct = default)
        {
            var page = Math.Max(criteria.Page, 1);
            var pageSize = Math.Clamp(criteria.PageSize, 1, MaxPageSize);

            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<PagedResponse<SesionEjercicioItemDto>>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            if (await sesionRepository.GetByIdAsync(id, psicopedagogoId, ct) is null)
            {
                return Result<PagedResponse<SesionEjercicioItemDto>>.Failure($"La sesión con ID {id} no fue encontrada.", ErrorCodes.NotFound);
            }

            var (items, total) = await sesionRepository.GetEjerciciosAsync(id, psicopedagogoId, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<SesionEjercicioItemDto>>.Success(
                new PagedResponse<SesionEjercicioItemDto>(items.Select(SesionEjercicioItemDto.FromEntity).ToList(), total, page, pageSize));
        }

        public async Task<Result<SesionDto>> AddAsync(CreateSesionRequest sesion, CancellationToken ct = default)
        {
            var atencion = await pacienteRepository.GetAtencionAsync(sesion.PacienteId, sesion.PsicopedagogoId, ct);

            if (atencion is null || atencion.FechaFin is not null)
            {
                return Result<SesionDto>.Failure(
                    $"El psicopedagogo {sesion.PsicopedagogoId} no atiende actualmente al paciente {sesion.PacienteId}.",
                    ErrorCodes.Forbidden);
            }

            var ejercicioIds = sesion.EjercicioIds.Distinct().ToList();
            var faltantes = await Faltantes(ejercicioIds, ct);
            if (faltantes.Count > 0)
            {
                return Result<SesionDto>.Failure(
                    $"Ejercicio(s) no encontrado(s): {string.Join(", ", faltantes)}", ErrorCodes.NotFound);
            }

            var newSesion = new Sesion
            {
                PacienteId = sesion.PacienteId,
                PsicopedagogoId = sesion.PsicopedagogoId,
                Fecha = DateTime.Now,
                SesionEjercicios = ejercicioIds.Select(id => new SesionEjercicio { EjercicioId = id }).ToList()
            };

            await sesionRepository.AddAsync(newSesion, ct);

            logger.LogInformation("Sesion creada: {Id} ({fecha})", newSesion.Id, newSesion.Fecha);

            return Result<SesionDto>.Success(SesionDto.FromEntity(newSesion));
        }

        public async Task<Result<SesionDto>> UpdateAsync(int id, int psicopedagogoId, UpsertSesionRequest sesion, CancellationToken ct = default)
        {
            var ejercicioIds = sesion.EjercicioIds.Distinct().ToList();
            var faltantes = await Faltantes(ejercicioIds, ct);
            if (faltantes.Count > 0)
            {
                return Result<SesionDto>.Failure(
                    $"Ejercicio(s) no encontrado(s): {string.Join(", ", faltantes)}", ErrorCodes.NotFound);
            }

            // Suma los ejercicios nuevos a los que la sesión ya tenía; no borra ni reemplaza nada.
            var updated = await sesionRepository.AgregarEjerciciosAsync(id, psicopedagogoId, ejercicioIds, ct);
            if (updated is null)
            {
                return Result<SesionDto>.Failure($"La sesión con ID {id} no fue encontrada.", ErrorCodes.NotFound);
            }

            logger.LogInformation("Sesion actualizada: {Id}", id);
            return Result<SesionDto>.Success(SesionDto.FromEntity(updated));
        }

        private async Task<List<int>> Faltantes(List<int> ejercicioIds, CancellationToken ct)
        {
            var existentes = await ejercicioRepository.GetExistingIdsAsync(ejercicioIds, ct);
            return ejercicioIds.Except(existentes).ToList();
        }
    }
}
