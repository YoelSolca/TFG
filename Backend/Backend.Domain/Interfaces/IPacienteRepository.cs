using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public interface IPacienteRepository
    {
        // Pacientes que atiende el profesional (con su búsqueda y filtro por dificultad), ya paginados.
        Task<(IReadOnlyList<Paciente> Items, int TotalCount)> GetPacientesAsync(
            int psicopedagogoId, string? search, int? tipoDificultadId, int skip, int take, CancellationToken ct = default);
        // Ejercicios ya realizados por un paciente (los que tienen resultado), del más nuevo al más viejo.
        Task<(IReadOnlyList<SesionEjercicio> Items, int TotalCount)> GetHistorialAsync(
            int pacienteId, int psicopedagogoId, int? tipoEjercicioId, DateTime? fecha, int skip, int take, CancellationToken ct = default);
        // Los mismos ejercicios realizados, sin paginar y de la sesión más vieja a la más nueva: la evolución necesita todo el período.
        Task<IReadOnlyList<SesionEjercicio>> GetEvolucionAsync(
            int pacienteId, int psicopedagogoId, DateTime? desde, DateTime? hasta, CancellationToken ct = default);
        // La atención del profesional a ese paciente, con lo necesario para armar su ficha.
        Task<PsicopedagogoPaciente?> GetDetalleAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        Task<Sesion?> GetUltimaSesionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        Task<IReadOnlyList<TipoDificultad>> GetTiposDificultadAsync(CancellationToken ct = default);
        Task<Paciente> AddPacienteAsync(Paciente paciente, CancellationToken ct = default);
        Task<Paciente?> GetByDocumentoAsync(string documento, CancellationToken ct = default);
        Task<bool> TiposDificultadExistenAsync(IReadOnlyCollection<int> ids, CancellationToken ct = default);
        Task<Paciente?> GetForUpdateAsync(int id, CancellationToken ct = default);
        Task UpdateAsync(Paciente paciente, CancellationToken ct = default);
        Task<PsicopedagogoPaciente?> GetAtencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        Task IniciarAtencionAsync(PsicopedagogoPaciente atencion, CancellationToken ct = default);
        Task<bool> ReactivarAtencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        Task<bool> FinalizarAtencionAsync(int pacienteId, int psicopedagogoId, DateTime fechaFin, CancellationToken ct = default);
        Task<Intervencion?> GetIntervencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        Task<bool> UpdateIntervencionAsync(int pacienteId, int psicopedagogoId, string? objetivo, string? observaciones, CancellationToken ct = default);
    }
}
