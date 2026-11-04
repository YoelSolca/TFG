using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public interface ISesionRepository
    {
        Task<(IReadOnlyList<Sesion> Items, int TotalCount)> GetAllAsync(int psicopedagogoId, string? nombreApellido, EstadoSesion? estado, DateTime? fecha, int skip, int take, CancellationToken ct = default);
        Task<Sesion?> GetByIdAsync(int id, int psicopedagogoId, CancellationToken ct = default);
        Task<(IReadOnlyList<SesionEjercicio> Items, int TotalCount)> GetEjerciciosAsync(int sesionId, int psicopedagogoId, int skip, int take, CancellationToken ct = default);
        Task<Sesion?> AddAsync(Sesion sesion, CancellationToken ct = default);
        Task<Sesion?> AgregarEjerciciosAsync(int sesionId, int psicopedagogoId, IEnumerable<int> ejercicioIds, CancellationToken ct = default);
    }
}
