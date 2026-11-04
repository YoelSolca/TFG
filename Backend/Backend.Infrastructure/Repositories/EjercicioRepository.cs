using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class EjercicioRepository(AppDbContext context) : IEjercicioRepository
    {
        public async Task<(IReadOnlyList<Ejercicio> Items, int TotalCount)> GetAllEjercicioAsync(EjercicioSearchFilter filter, int skip, int take, CancellationToken ct = default)
        {
            var query =  context.Ejercicio.AsNoTracking()
                                .Include(e => e.TipoEjercicio)
                                .AsQueryable();


            if (filter.TipoEjercicioId.HasValue)
                query = query.Where(e => e.TipoEjercicioId == filter.TipoEjercicioId);



            var total = await query.CountAsync(ct);

            var items = await query.OrderBy(e => e.Nombre)
                             .ThenBy(e => e.Id)
                             .Skip(skip)
                             .Take(take)
                             .ToListAsync(ct);

            return (items, total);
        }

        public async Task<IReadOnlyList<int>> GetExistingIdsAsync(IEnumerable<int> ids, CancellationToken ct = default)
            => await context.Ejercicio.Where(e => ids.Contains(e.Id)).Select(e => e.Id).ToListAsync(ct);

        // Ejercicios realizados = ejercicios de una sesión que ya tienen resultado. Se consulta SesionEjercicio, no el catálogo.
        public async Task<(IReadOnlyList<SesionEjercicio> Items, int TotalCount)> GetRealizadosAsync(
            int psicopedagogoId, string? nombreApellido, int? tipoEjercicioId, DateTime? fecha,
            int skip, int take, CancellationToken ct = default)
        {
            var query = context.SesionEjercicio.AsNoTracking()
                .Where(se => se.Resultado != null
                          && se.Sesion.PsicopedagogoId == psicopedagogoId
                          && se.Sesion.PsicopedagogoPaciente.FechaFin == null);

            if (!string.IsNullOrWhiteSpace(nombreApellido))
            {
                // "Juan Perez": cada palabra tiene que coincidir con el nombre o con el apellido
                foreach (var palabra in nombreApellido.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    var term = palabra;
                    query = query.Where(se => se.Sesion.PsicopedagogoPaciente.Paciente.Persona.Nombre.Contains(term)
                                           || se.Sesion.PsicopedagogoPaciente.Paciente.Persona.Apellido.Contains(term));
                }
            }

            if (tipoEjercicioId.HasValue)
                query = query.Where(se => se.Ejercicio.TipoEjercicioId == tipoEjercicioId);

            if (fecha is DateTime f)
            {
                var dia = f.Date;
                query = query.Where(se => se.Resultado!.FechaRegistro >= dia && se.Resultado.FechaRegistro < dia.AddDays(1));
            }

            var total = await query.CountAsync(ct);

            var items = await query
                .Include(se => se.Resultado)
                .Include(se => se.Ejercicio).ThenInclude(e => e.TipoEjercicio)
                .Include(se => se.Sesion).ThenInclude(s => s.PsicopedagogoPaciente).ThenInclude(pp => pp.Paciente).ThenInclude(p => p.Persona)
                .OrderByDescending(se => se.Resultado!.FechaRegistro)
                .ThenByDescending(se => se.SesionId)
                .ThenBy(se => se.EjercicioId)
                .Skip(skip).Take(take)
                .ToListAsync(ct);

            return (items, total);
        }
    }
}
