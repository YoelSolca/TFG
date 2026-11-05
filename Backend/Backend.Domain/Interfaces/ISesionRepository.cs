using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public interface ISesionRepository
    {
        Task<(IReadOnlyList<Sesion> Items, int TotalCount)> GetAllAsync(int psicopedagogoId, string? nombreApellido, EstadoSesion? estado, DateTime? fecha, int skip, int take, CancellationToken ct = default);
        Task<Sesion?> GetByIdAsync(int id, int psicopedagogoId, CancellationToken ct = default);
        Task<(IReadOnlyList<SesionEjercicio> Items, int TotalCount)> GetEjerciciosAsync(int sesionId, int psicopedagogoId, int skip, int take, CancellationToken ct = default);
        Task<Sesion?> AddAsync(Sesion sesion, CancellationToken ct = default);
        // La sesión planificada del paciente (sin seguimiento), con sus ejercicios; null si no tiene.
        Task<Sesion?> GetPlanificadaAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        // Guarda los cambios hechos sobre una sesión obtenida con GetForUpdateAsync.
        Task SaveChangesAsync(CancellationToken ct = default);
        // Con seguimiento de cambios y con sus ejercicios (y resultados) cargados, para modificarla.
        Task<Sesion?> GetForUpdateAsync(int id, int psicopedagogoId, CancellationToken ct = default);
        // Deja en la sesión exactamente estos ejercicios, con Orden según su posición en la lista, y guarda.
        Task ReemplazarEjerciciosAsync(Sesion sesion, IReadOnlyList<int> ejercicioIds, CancellationToken ct = default);
    }
}
