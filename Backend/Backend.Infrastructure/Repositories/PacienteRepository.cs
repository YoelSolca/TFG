using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Repositories
{
    public class PacienteRepository(AppDbContext context) : IPacienteRepository
    {
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
