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
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<SesionDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var atencion = await pacienteRepository.GetAtencionAsync(sesion.PacienteId, psicopedagogoId, ct);

            if (atencion is null || atencion.FechaFin is not null)
            {
                return Result<SesionDto>.Failure(
                    $"No atendés actualmente al paciente {sesion.PacienteId}.",
                    ErrorCodes.Forbidden);
            }

            // Un paciente tiene a lo sumo un plan guardado: para cambiarlo se edita (PUT), no se crea otro.
            if (await sesionRepository.GetPlanificadaAsync(sesion.PacienteId, psicopedagogoId, ct) is not null)
            {
                return Result<SesionDto>.Failure(
                    $"El paciente {sesion.PacienteId} ya tiene una sesión planificada. Modificala o iniciala.",
                    ErrorCodes.Duplicate);
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
                PsicopedagogoId = psicopedagogoId,
                Fecha = DateTime.Now,
                // El Orden es la posición en la lista, empezando en 1: es el orden en que se van a hacer.
                SesionEjercicios = ejercicioIds.Select((id, i) => new SesionEjercicio { EjercicioId = id, Orden = i + 1 }).ToList()
            };

            await sesionRepository.AddAsync(newSesion, ct);

            logger.LogInformation("Sesion creada: {Id} ({fecha})", newSesion.Id, newSesion.Fecha);

            return Result<SesionDto>.Success(SesionDto.FromEntity(newSesion));
        }

        public async Task<Result<SesionDto>> UpdateAsync(int id, UpsertSesionRequest sesion, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<SesionDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            // Solo se busca entre las sesiones del profesional logueado: la de otro se informa como inexistente.
            var existente = await sesionRepository.GetForUpdateAsync(id, psicopedagogoId, ct);
            if (existente is null)
            {
                return Result<SesionDto>.Failure($"La sesión con ID {id} no fue encontrada.", ErrorCodes.NotFound);
            }

            if (existente.Estado != EstadoSesion.Planificada || existente.SesionEjercicios.Any(se => se.Resultado is not null))
            {
                return Result<SesionDto>.Failure(
                    "Solo se pueden modificar los ejercicios de una sesión planificada que todavía no tiene resultados.",
                    ErrorCodes.ValidationError);
            }

            var ejercicioIds = sesion.EjercicioIds.Distinct().ToList();
            var faltantes = await Faltantes(ejercicioIds, ct);
            if (faltantes.Count > 0)
            {
                return Result<SesionDto>.Failure(
                    $"Ejercicio(s) no encontrado(s): {string.Join(", ", faltantes)}", ErrorCodes.NotFound);
            }

            await sesionRepository.ReemplazarEjerciciosAsync(existente, ejercicioIds, ct);

            logger.LogInformation("Sesion actualizada: {Id}", id);
            return Result<SesionDto>.Success(SesionDto.FromEntity(existente));
        }

        public async Task<Result<SesionDto>> GetPlanificadaAsync(int pacienteId, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<SesionDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var plan = await sesionRepository.GetPlanificadaAsync(pacienteId, psicopedagogoId, ct);

            return plan is null
                ? Result<SesionDto>.Failure($"El paciente {pacienteId} no tiene una sesión planificada.", ErrorCodes.NotFound)
                : Result<SesionDto>.Success(SesionDto.FromEntity(plan));
        }

        public Task<Result<SesionDto>> IniciarAsync(int id, CancellationToken ct = default)
            => CambiarEstadoAsync(id, EstadoSesion.Planificada, EstadoSesion.EnCurso, ct);

        public Task<Result<SesionDto>> FinalizarAsync(int id, CancellationToken ct = default)
            => CambiarEstadoAsync(id, EstadoSesion.EnCurso, EstadoSesion.Finalizada, ct);

        private async Task<Result<SesionDto>> CambiarEstadoAsync(int id, EstadoSesion desde, EstadoSesion hasta, CancellationToken ct)
        {
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<SesionDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var sesion = await sesionRepository.GetForUpdateAsync(id, psicopedagogoId, ct);
            if (sesion is null)
            {
                return Result<SesionDto>.Failure($"La sesión con ID {id} no fue encontrada.", ErrorCodes.NotFound);
            }

            if (sesion.Estado != desde)
            {
                return Result<SesionDto>.Failure(
                    $"La sesión está {sesion.Estado}: solo se puede pasar a {hasta} desde {desde}.",
                    ErrorCodes.ValidationError);
            }

            sesion.Estado = hasta;
            if (hasta == EstadoSesion.EnCurso)
            {
                // La fecha de una sesión es cuándo se hizo, no cuándo se planificó.
                sesion.Fecha = DateTime.Now;
            }

            await sesionRepository.SaveChangesAsync(ct);

            logger.LogInformation("Sesion {Id}: {Desde} -> {Hasta}", id, desde, hasta);
            return Result<SesionDto>.Success(SesionDto.FromEntity(sesion));
        }

        private async Task<List<int>> Faltantes(List<int> ejercicioIds, CancellationToken ct)
        {
            var existentes = await ejercicioRepository.GetExistingIdsAsync(ejercicioIds, ct);
            return ejercicioIds.Except(existentes).ToList();
        }
    }
}
