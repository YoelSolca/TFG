using Backend.Domain.Entities;

namespace Backend.Domain.Interfaces
{
    public interface IInformeRepository
    {
        Task<bool> PacientePerteneceAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        Task<(IReadOnlyList<Informe> Items, int TotalCount)> GetAllAsync(
            int psicopedagogoId, string? nombreApellido, DateTime? fecha,
            int skip, int take, CancellationToken ct = default);
        Task<Informe?> GetByIdAsync(int id, int psicopedagogoId, CancellationToken ct = default);
        Task<Informe> AddAsync(Informe informe, CancellationToken ct = default);
    }
}
