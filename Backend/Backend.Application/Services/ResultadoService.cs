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
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<ResultadoDetalleDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var detalle = await repository.GetDetalleAsync(sesionId, ejercicioId, psicopedagogoId, ct);

            return detalle is null
                ? Result<ResultadoDetalleDto>.Failure($"El ejercicio {ejercicioId} no está en la sesión {sesionId}.", ErrorCodes.NotFound)
                : Result<ResultadoDetalleDto>.Success(ResultadoDetalleDto.FromEntity(detalle));
        }

        public async Task<Result<ResultadoDto>> UpsertAsync(int sesionId, int ejercicioId, UpsertResultadoRequest request, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int psicopedagogoId)
            {
                return Result<ResultadoDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            if (!await repository.SesionEjercicioPerteneceAsync(sesionId, ejercicioId, psicopedagogoId, ct))
            {
                return Result<ResultadoDto>.Failure(
                    $"El psicopedagogo {psicopedagogoId} no tiene el ejercicio {ejercicioId} en la sesión {sesionId}.", ErrorCodes.Forbidden);
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

            var resultado = new Resultado
            {
                SesionId = sesionId,
                EjercicioId = ejercicioId,
                Aciertos = request.Aciertos,
                Errores = request.Errores,
                TiempoSegundos = request.TiempoSegundos,
                Observaciones = request.Observaciones,
                FechaRegistro = DateTime.Now,
                ResultadoMetricas = (request.Metricas ?? [])
                    .Select(m => new ResultadoMetrica { MetricaId = m.MetricaId, Valor = m.Valor })
                    .ToList()
            };

            var guardado = await repository.UpsertAsync(resultado, ct);

            // El repositorio devuelve la entidad ya trackeada sin las Metricas cargadas por nombre; se relee para el DTO.
            var completo = await repository.GetAsync(sesionId, ejercicioId, ct);
            return Result<ResultadoDto>.Success(ResultadoDto.FromEntity(completo!));
        }
    }
}
