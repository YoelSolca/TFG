using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IPacienteQueries
    {
        Task<PagedResponse<PacienteListItemDto>> GetPacientesAsync(int psicopedagogoId, string? search, int? tipoDificultadId, int page, int pageSize, CancellationToken ct = default);
        Task<PagedResponse<PacienteHistorialItemDto>> GetHistorialAsync(int pacienteId, int psicopedagogoId, int? tipoEjercicioId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default);
        Task<IReadOnlyList<SesionSeguimientoDto>> GetSeguimientoAsync(int pacienteId, int psicopedagogoId, DateTime? desde, DateTime? hasta, CancellationToken ct = default);
        Task<PagedResponse<PacienteInformeItemDto>> GetInformesAsync(int pacienteId, int psicopedagogoId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default);
        Task<PacienteDetalleDto?> GetDetalleAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
    }
}
