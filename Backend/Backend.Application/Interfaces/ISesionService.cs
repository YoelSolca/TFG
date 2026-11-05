using Backend.Application.Common;
using Backend.Application.DTO;

namespace Backend.Application.Interfaces
{
    public interface ISesionService
    {
        Task<Result<PagedResponse<SesionListItemDto>>> GetAllAsync(SesionSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default);
        Task<Result<SesionListItemDto>> GetByIdAsync(int id, CancellationToken ct = default);
        Task<Result<PagedResponse<SesionEjercicioItemDto>>> GetEjerciciosAsync(int id, SesionEjerciciosCriteria criteria, CancellationToken ct = default);
        Task<Result<SesionDto>> AddAsync(CreateSesionRequest sesion, CancellationToken ct = default);
        // Reemplaza los ejercicios de una sesión planificada (mismo orden que la lista recibida).
        Task<Result<SesionDto>> UpdateAsync(int id, UpsertSesionRequest sesion, CancellationToken ct = default);
        // El plan guardado (sesión planificada) del paciente; NotFound si no tiene.
        Task<Result<SesionDto>> GetPlanificadaAsync(int pacienteId, CancellationToken ct = default);
        // Planificada -> EnCurso; la fecha pasa a ser el momento en que se inicia.
        Task<Result<SesionDto>> IniciarAsync(int id, CancellationToken ct = default);
        // EnCurso -> Finalizada.
        Task<Result<SesionDto>> FinalizarAsync(int id, CancellationToken ct = default);
    }
}
