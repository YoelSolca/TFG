using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;

namespace Backend.Application.Services
{
    public class ResultadoService(
        IResultadoRepository repository,
        IMetricaRepository metricaRepository,
        IUsuarioActual usuarioActual
        ) : IResultadoService
    {
        public async Task<Result<ResultadoDetalleDto>> GetAsync(int sesionId, int ejercicioId, CancellationToken ct = default)
        {
            var detalle = await repository.GetDetalleAsync(sesionId, ejercicioId, usuarioActual.UserId, ct);

            return detalle is null
                ? Result<ResultadoDetalleDto>.Failure($"El ejercicio {ejercicioId} no está en la sesión {sesionId}.", ErrorCodes.NotFound)
                : Result<ResultadoDetalleDto>.Success(ResultadoDetalleDto.FromEntity(detalle));
        }

        public async Task<Result<ResultadoDto>> UpsertAsync(int sesionId, int ejercicioId, UpsertResultadoRequest request, CancellationToken ct = default)
        {
            if (!await repository.SesionEjercicioPerteneceAsync(sesionId, ejercicioId, usuarioActual.UserId, ct))
            {
                return Result<ResultadoDto>.Failure(
                    $"El psicopedagogo {usuarioActual.UserId} no tiene el ejercicio {ejercicioId} en la sesión {sesionId}.", ErrorCodes.Forbidden);
            }

            var metricaIds = (request.Metricas ?? []).Select(m => m.MetricaId).Distinct().ToList();
            if (metricaIds.Count > 0)
            {
                var existentes = await metricaRepository.GetExistingIdsAsync(metricaIds, ct);
                var faltantes = metricaIds.Except(existentes).ToList();
                if (faltantes.Count > 0)
                {
                    return Result<ResultadoDto>.Failure(
                        $"Métrica(s) no encontrada(s): {string.Join(", ", faltantes)}", ErrorCodes.NotFound);
                }
            }

            var validacion = Resultado.Validar(request.Aciertos, request.Errores, request.TiempoSegundos, request.Observaciones);
            if (!validacion.EsExitoso)
            {
                return Result<ResultadoDto>.Failure(validacion.Error!, ErrorCodes.ValidationError);
            }

            var ahora = DateTime.Now;
            var metricas = (request.Metricas ?? []).Select(m => (m.MetricaId, m.Valor)).ToList();

            // Si el ejercicio ya tenía resultado se reemplaza (con la entidad); si no, se crea uno nuevo.
            var existente = await repository.GetForUpdateAsync(sesionId, ejercicioId, ct);
            if (existente is null)
            {
                await repository.AddAsync(
                    new Resultado(sesionId, ejercicioId, request.Aciertos, request.Errores, request.TiempoSegundos, request.Observaciones, ahora, metricas), ct);
            }
            else
            {
                var cambio = existente.Actualizar(request.Aciertos, request.Errores, request.TiempoSegundos, request.Observaciones, ahora, metricas);
                if (!cambio.EsExitoso)
                {
                    return Result<ResultadoDto>.Failure(cambio.Error!, ErrorCodes.ValidationError);
                }

                await repository.SaveChangesAsync(ct);
            }

            // El repositorio devuelve la entidad ya trackeada sin las Metricas cargadas por nombre; se relee para el DTO.
            var completo = await repository.GetAsync(sesionId, ejercicioId, ct);
            return Result<ResultadoDto>.Success(ResultadoDto.FromEntity(completo!));
        }
    }
}
