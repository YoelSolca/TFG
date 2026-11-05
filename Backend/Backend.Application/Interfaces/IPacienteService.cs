using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface IPacienteService
    {
        Task<Result<RegistroPacienteResult>> CreatePacienteAsync(CreatePacienteRequest request, CancellationToken ct = default);
        Task<Result<PacienteDetalleDto>> GetDetalleAsync(int pacienteId, CancellationToken ct = default);
        Task<Result<PagedResponse<PacienteHistorialItemDto>>> GetHistorialAsync(int pacienteId, int? tipoEjercicioId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default);
        Task<Result<IReadOnlyList<SesionSeguimientoDto>>> GetSeguimientoAsync(int pacienteId, DateTime? desde, DateTime? hasta, CancellationToken ct = default);
        Task<Result<PagedResponse<PacienteInformeItemDto>>> GetInformesAsync(int pacienteId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default);
        Task<Result<PagedResponse<PacienteListItemDto>>> GetPacientesAsync(string? search, int? tipoDificultadId, int page, int pageSize, CancellationToken ct = default);
        Task<Result<PacienteDto>> UpdatePacienteAsync(int pacienteId, UpsertPacienteRequest request, CancellationToken ct = default);
        Task<Result<IntervencionDto>> GetIntervencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default);
        Task<Result<IntervencionDto>> UpdateIntervencionAsync(int pacienteId, UpsertIntervencionRequest request, CancellationToken ct = default);
    }
}
