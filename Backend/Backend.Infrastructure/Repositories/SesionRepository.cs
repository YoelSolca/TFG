using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class SesionRepository(AppDbContext context) : ISesionRepository
    {
        public async Task<(IReadOnlyList<Sesion> Items, int TotalCount)> GetAllAsync(int psicopedagogoId, string? nombreApellido, EstadoSesion? estado,
                                                                                    DateTime? fecha, int skip, int take, CancellationToken ct = default)
        {
            var query = context.Sesion.AsNoTracking()
                .Include(s => s.PsicopedagogoPaciente).ThenInclude(pp => pp.Paciente).ThenInclude(p => p.Persona)
                .Include(s => s.PsicopedagogoPaciente).ThenInclude(pp => pp.Intervencion).ThenInclude(i => i.TiposDificultad).ThenInclude(t => t.TipoDificultad)
                .Where(s => s.PsicopedagogoId == psicopedagogoId);

            if (estado.HasValue)
                query = query.Where(s => s.Estado == estado);

            if (!string.IsNullOrWhiteSpace(nombreApellido))
            {
                // "Juan Perez": cada palabra tiene que coincidir con el nombre o con el apellido
                foreach (var palabra in nombreApellido.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    var term = palabra;
                    query = query.Where(s => s.PsicopedagogoPaciente.Paciente.Persona.Nombre.Contains(term)
                                          || s.PsicopedagogoPaciente.Paciente.Persona.Apellido.Contains(term));
                }
            }

            if (fecha.HasValue)
            {
                var dia = fecha.Value.Date;
                query = query.Where(s => s.Fecha >= dia && s.Fecha < dia.AddDays(1));
            }

            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(s => s.Fecha).ThenBy(s => s.Id)
                                   .Skip(skip).Take(take).ToListAsync(ct);

            return (items, total);
        }


        public async Task<Sesion?> GetByIdAsync(int id, int psicopedagogoId, CancellationToken ct = default)
        => await context.Sesion.AsNoTracking()
            .Include(s => s.PsicopedagogoPaciente).ThenInclude(pp => pp.Paciente).ThenInclude(p => p.Persona)
            .Include(s => s.PsicopedagogoPaciente).ThenInclude(pp => pp.Intervencion).ThenInclude(i => i.TiposDificultad).ThenInclude(t => t.TipoDificultad)
            .FirstOrDefaultAsync(s => s.Id == id && s.PsicopedagogoId == psicopedagogoId, ct);

        public async Task<(IReadOnlyList<SesionEjercicio> Items, int TotalCount)> GetEjerciciosAsync(int sesionId, int psicopedagogoId, int skip, int take, CancellationToken ct = default)
        {
            var query = context.SesionEjercicio.AsNoTracking()
                .Where(se => se.SesionId == sesionId && se.Sesion.PsicopedagogoId == psicopedagogoId);

            var total = await query.CountAsync(ct);
            var items = await query
                .Include(se => se.Ejercicio).ThenInclude(e => e.TipoEjercicio)
                .Include(se => se.Resultado)
                .OrderBy(se => se.Orden).ThenBy(se => se.EjercicioId)
                .Skip(skip).Take(take).ToListAsync(ct);

            return (items, total);
        }

        public async Task<Sesion?> AddAsync(Sesion sesion, CancellationToken ct = default)
        {
            context.Sesion.Add(sesion);
            await context.SaveChangesAsync(ct);
            return sesion;
        }

        public async Task<Sesion?> GetPlanificadaAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
            => await context.Sesion.AsNoTracking()
                .Include(s => s.SesionEjercicios)
                .FirstOrDefaultAsync(s => s.PacienteId == pacienteId && s.PsicopedagogoId == psicopedagogoId
                                       && s.Estado == EstadoSesion.Planificada, ct);

        public async Task SaveChangesAsync(CancellationToken ct = default)
            => await context.SaveChangesAsync(ct);

        public async Task<Sesion?> GetForUpdateAsync(int id, int psicopedagogoId, CancellationToken ct = default)
            => await context.Sesion
                .Include(s => s.SesionEjercicios).ThenInclude(se => se.Resultado)
                .FirstOrDefaultAsync(s => s.Id == id && s.PsicopedagogoId == psicopedagogoId, ct);

        public async Task ReemplazarEjerciciosAsync(Sesion sesion, IReadOnlyList<int> ejercicioIds, CancellationToken ct = default)
        {
            // Los que ya no están en la lista se borran explícitamente: sacarlos de la colección no alcanza
            // porque la relación con la sesión es Restrict.
            var aQuitar = sesion.SesionEjercicios.Where(se => !ejercicioIds.Contains(se.EjercicioId)).ToList();
            context.SesionEjercicio.RemoveRange(aQuitar);

            for (var i = 0; i < ejercicioIds.Count; i++)
            {
                var ejercicioId = ejercicioIds[i];
                var existente = sesion.SesionEjercicios.FirstOrDefault(se => se.EjercicioId == ejercicioId);

                if (existente is null)
                    sesion.SesionEjercicios.Add(new SesionEjercicio { SesionId = sesion.Id, EjercicioId = ejercicioId, Orden = i + 1 });
                else
                    existente.Orden = i + 1;
            }

            await context.SaveChangesAsync(ct);
        }
    }
}
