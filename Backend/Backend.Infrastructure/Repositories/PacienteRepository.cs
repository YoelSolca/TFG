using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class PacienteRepository(AppDbContext context) : IPacienteRepository
    {
        public async Task<(IReadOnlyList<Paciente> Items, int TotalCount)> GetPacientesAsync(
            int psicopedagogoId, string? search, int? tipoDificultadId, int skip, int take, CancellationToken ct = default)
        {
            var query = context.Paciente.AsNoTracking()
                .Where(p => p.PsicopedagogoPacientes.Any(pp => pp.PsicopedagogoId == psicopedagogoId && pp.FechaFin == null));

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(p => p.Persona.Nombre.Contains(term)
                                      || p.Persona.Apellido.Contains(term)
                                      || p.Persona.Documento.Contains(term));
            }

            if (tipoDificultadId is int tipoId)
            {
                query = query.Where(p => p.PsicopedagogoPacientes.Any(pp => pp.PsicopedagogoId == psicopedagogoId
                                                                         && pp.Intervencion.TiposDificultad.Any(t => t.TipoDificultadId == tipoId)));
            }

            var total = await query.CountAsync(ct);

            // El Include filtrado trae solo la atención de este profesional (el paciente puede tener otras con otros profesionales).
            var items = await query
                .Include(p => p.Persona)
                .Include(p => p.PsicopedagogoPacientes.Where(pp => pp.PsicopedagogoId == psicopedagogoId))
                    .ThenInclude(pp => pp.Intervencion).ThenInclude(i => i.TiposDificultad).ThenInclude(t => t.TipoDificultad)
                .OrderBy(p => p.Persona.Apellido)
                .ThenBy(p => p.Persona.Nombre)
                .ThenBy(p => p.PersonaId)
                .Skip(skip).Take(take)
                .ToListAsync(ct);

            return (items, total);
        }

        // Ejercicios realizados = los que ya tienen resultado; los de una sesión planificada o en curso todavía no cuentan.
        private IQueryable<SesionEjercicio> RealizadosDe(int pacienteId, int psicopedagogoId)
            => context.SesionEjercicio.AsNoTracking()
                .Where(se => se.Resultado != null
                          && se.Sesion.PsicopedagogoPaciente.PsicopedagogoId == psicopedagogoId
                          && se.Sesion.PsicopedagogoPaciente.PacienteId == pacienteId
                          && se.Sesion.PsicopedagogoPaciente.FechaFin == null);

        public async Task<(IReadOnlyList<SesionEjercicio> Items, int TotalCount)> GetHistorialAsync(
            int pacienteId, int psicopedagogoId, int? tipoEjercicioId, DateTime? fecha, int skip, int take, CancellationToken ct = default)
        {
            var query = RealizadosDe(pacienteId, psicopedagogoId);

            if (tipoEjercicioId is int tipoId)
                query = query.Where(se => se.Ejercicio.TipoEjercicioId == tipoId);

            if (fecha is DateTime f)
                query = query.Where(se => se.Sesion.Fecha.Date == f.Date);

            var total = await query.CountAsync(ct);

            var items = await query
                .Include(se => se.Sesion)
                .Include(se => se.Ejercicio).ThenInclude(e => e.TipoEjercicio)
                .Include(se => se.Resultado!).ThenInclude(r => r.ResultadoMetricas).ThenInclude(m => m.Metrica)
                .OrderByDescending(se => se.Sesion.Fecha)
                .ThenByDescending(se => se.SesionId)
                .ThenBy(se => se.Orden)
                .Skip(skip).Take(take)
                .ToListAsync(ct);

            return (items, total);
        }

        public async Task<IReadOnlyList<SesionEjercicio>> GetEvolucionAsync(
            int pacienteId, int psicopedagogoId, DateTime? desde, DateTime? hasta, CancellationToken ct = default)
        {
            var query = RealizadosDe(pacienteId, psicopedagogoId);

            if (desde is DateTime d)
                query = query.Where(se => se.Sesion.Fecha >= d.Date);

            if (hasta is DateTime h)
            {
                var finDelDia = h.Date.AddDays(1);
                query = query.Where(se => se.Sesion.Fecha < finDelDia);
            }

            return await query
                .Include(se => se.Sesion)
                .Include(se => se.Ejercicio).ThenInclude(e => e.TipoEjercicio)
                .Include(se => se.Resultado).ThenInclude(r => r!.ResultadoMetricas).ThenInclude(m => m.Metrica)
                .OrderBy(se => se.Sesion.Fecha)
                .ThenBy(se => se.SesionId)
                .ThenBy(se => se.Orden)
                .ToListAsync(ct);
        }

        public Task<PsicopedagogoPaciente?> GetDetalleAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
            => context.PsicopedagogoPaciente.AsNoTracking()
                .Include(x => x.Paciente).ThenInclude(p => p.Persona)
                .Include(x => x.Intervencion).ThenInclude(i => i.TiposDificultad).ThenInclude(t => t.TipoDificultad)
                .FirstOrDefaultAsync(x => x.PacienteId == pacienteId && x.PsicopedagogoId == psicopedagogoId, ct);

        public Task<Sesion?> GetUltimaSesionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
            => context.Sesion.AsNoTracking()
                .Include(s => s.SesionEjercicios).ThenInclude(se => se.Ejercicio).ThenInclude(e => e.TipoEjercicio)
                .Where(s => s.PsicopedagogoPaciente.PacienteId == pacienteId && s.PsicopedagogoPaciente.PsicopedagogoId == psicopedagogoId)
                .OrderByDescending(s => s.Fecha)
                .FirstOrDefaultAsync(ct);

        public async Task<IReadOnlyList<TipoDificultad>> GetTiposDificultadAsync(CancellationToken ct = default)
            => await context.TipoDificultad.AsNoTracking().OrderBy(t => t.Nombre).ToListAsync(ct);

        public async Task<Paciente?> GetByDocumentoAsync(string documento, CancellationToken ct = default)
        => await context.Paciente.AsNoTracking().FirstOrDefaultAsync(p => p.Persona.Documento == documento, ct);

        public async Task<bool> TiposDificultadExistenAsync(IReadOnlyCollection<int> ids, CancellationToken ct = default)
        => await context.TipoDificultad.CountAsync(t => ids.Contains(t.Id), ct) == ids.Count;

        public async Task<Paciente?> GetForUpdateAsync(int id, CancellationToken ct = default)
        => await context.Paciente.Include(p => p.Persona).Include(p => p.PsicopedagogoPacientes).ThenInclude(p => p.Intervencion).ThenInclude(i => i.TiposDificultad).FirstOrDefaultAsync(p => p.PersonaId == id, ct);

        public async Task<Paciente> AddPacienteAsync(Paciente paciente, CancellationToken ct = default)
        {
            await context.Paciente.AddAsync(paciente);
            await context.SaveChangesAsync(ct);
            return paciente;
        }

        public async Task UpdateAsync(Paciente paciente, CancellationToken ct = default)
        {
            await context.SaveChangesAsync(ct);
        }

        public async Task<PsicopedagogoPaciente?> GetAtencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
            => await context.Set<PsicopedagogoPaciente>().AsNoTracking()
                .FirstOrDefaultAsync(x => x.PacienteId == pacienteId && x.PsicopedagogoId == psicopedagogoId, ct);

        public async Task IniciarAtencionAsync(PsicopedagogoPaciente atencion, CancellationToken ct = default)
        {
            context.Set<PsicopedagogoPaciente>().Add(atencion);
            await context.SaveChangesAsync(ct);
        }

        public async Task<bool> ReactivarAtencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
            => await context.Set<PsicopedagogoPaciente>()
                .Where(x => x.PacienteId == pacienteId && x.PsicopedagogoId == psicopedagogoId && x.FechaFin != null)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaFin, (DateTime?)null), ct) > 0;

        public async Task<bool> FinalizarAtencionAsync(int pacienteId, int psicopedagogoId, DateTime fechaFin, CancellationToken ct = default)
            => await context.Set<PsicopedagogoPaciente>()
                .Where(x => x.PacienteId == pacienteId && x.PsicopedagogoId == psicopedagogoId && x.FechaFin == null)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaFin, (DateTime?)fechaFin), ct) > 0;
        public async Task<Intervencion?> GetIntervencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
            => await context.Set<PsicopedagogoPaciente>().AsNoTracking()
                .Where(x => x.PacienteId == pacienteId && x.PsicopedagogoId == psicopedagogoId)
                .Select(x => x.Intervencion)
                .FirstOrDefaultAsync(ct);

        public async Task<bool> UpdateIntervencionAsync(int pacienteId, int psicopedagogoId, string? objetivo, string? observaciones, CancellationToken ct = default)
            => await context.Intervencion
                .Where(i => i.PsicopedagogoPaciente!.PacienteId == pacienteId && i.PsicopedagogoPaciente.PsicopedagogoId == psicopedagogoId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.objetivo, objetivo)
                    .SetProperty(i => i.observaciones, observaciones), ct) > 0;
    }
}
