using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public record EjercicioSearchFilter (int? TipoEjercicioId);


    public interface IEjercicioRepository
    {
        Task<(IReadOnlyList<Ejercicio>  Items, int TotalCount)> GetAllEjercicioAsync(
            EjercicioSearchFilter filter,
            int skip, int take, CancellationToken ct = default);
        Task<IReadOnlyList<int>> GetExistingIdsAsync(IEnumerable<int> ids, CancellationToken ct = default);
        Task<(IReadOnlyList<SesionEjercicio> Items, int TotalCount)> GetRealizadosAsync(
            int psicopedagogoId, string? nombreApellido, int? tipoEjercicioId, DateTime? fecha,
            int skip, int take, CancellationToken ct = default);
    }
}
