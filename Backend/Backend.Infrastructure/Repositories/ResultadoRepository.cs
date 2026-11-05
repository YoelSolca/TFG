using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class ResultadoRepository(AppDbContext context) : IResultadoRepository
    {
        public Task<bool> SesionEjercicioPerteneceAsync(int sesionId, int ejercicioId, int psicopedagogoId, CancellationToken ct = default)
            => context.Set<SesionEjercicio>().AnyAsync(
                se => se.SesionId == sesionId && se.EjercicioId == ejercicioId && se.Sesion.PsicopedagogoId == psicopedagogoId, ct);

        public Task<Resultado?> GetAsync(int sesionId, int ejercicioId, CancellationToken ct = default)
            => context.Resultado.AsNoTracking()
                .Include(r => r.ResultadoMetricas).ThenInclude(rm => rm.Metrica)
                .FirstOrDefaultAsync(r => r.SesionId == sesionId && r.EjercicioId == ejercicioId, ct);

        public Task<SesionEjercicio?> GetDetalleAsync(int sesionId, int ejercicioId, int psicopedagogoId, CancellationToken ct = default)
            => context.SesionEjercicio.AsNoTracking()
                .Include(se => se.Ejercicio).ThenInclude(e => e.TipoEjercicio)
                .Include(se => se.Sesion).ThenInclude(s => s.PsicopedagogoPaciente).ThenInclude(pp => pp.Paciente).ThenInclude(p => p.Persona)
                .Include(se => se.Resultado).ThenInclude(r => r!.ResultadoMetricas).ThenInclude(rm => rm.Metrica)
                .FirstOrDefaultAsync(se => se.SesionId == sesionId && se.EjercicioId == ejercicioId && se.Sesion.PsicopedagogoId == psicopedagogoId, ct);

        public async Task<Resultado> UpsertAsync(Resultado resultado, CancellationToken ct = default)
        {
            var existente = await context.Resultado
                .Include(r => r.ResultadoMetricas)
                .FirstOrDefaultAsync(r => r.SesionId == resultado.SesionId && r.EjercicioId == resultado.EjercicioId, ct);

            if (existente is null)
            {
                context.Resultado.Add(resultado);
                await context.SaveChangesAsync(ct);
                return resultado;
            }

            existente.Aciertos = resultado.Aciertos;
            existente.Errores = resultado.Errores;
            existente.TiempoSegundos = resultado.TiempoSegundos;
            existente.Observaciones = resultado.Observaciones;
            existente.FechaRegistro = resultado.FechaRegistro;

            // Diff en vez de Clear + Add: reusar las filas ya trackeadas evita chocar con la clave
            // compuesta (SesionId, EjercicioId, MetricaId) cuando una métrica se repite sin cambios.
            var nuevasMetricaIds = resultado.ResultadoMetricas.Select(rm => rm.MetricaId).ToHashSet();
            var actualesMetricaIds = existente.ResultadoMetricas.Select(rm => rm.MetricaId).ToHashSet();

            foreach (var aQuitar in existente.ResultadoMetricas.Where(rm => !nuevasMetricaIds.Contains(rm.MetricaId)).ToList())
                existente.ResultadoMetricas.Remove(aQuitar);

            foreach (var rm in resultado.ResultadoMetricas)
            {
                if (actualesMetricaIds.Contains(rm.MetricaId))
                {
                    existente.ResultadoMetricas.First(x => x.MetricaId == rm.MetricaId).Valor = rm.Valor;
                }
                else
                {
                    existente.ResultadoMetricas.Add(new ResultadoMetrica
                    {
                        SesionId = existente.SesionId,
                        EjercicioId = existente.EjercicioId,
                        MetricaId = rm.MetricaId,
                        Valor = rm.Valor
                    });
                }
            }

            await context.SaveChangesAsync(ct);
            return existente;
        }
    }
}
