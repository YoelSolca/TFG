using Backend.Domain.Entities;
using System.Text.Json.Serialization;

namespace Backend.Domain.Interfaces
{

    public record PsicopedagogoSearchFilter(string? SearchTerm, [property: JsonConverter(typeof(JsonStringEnumConverter))] EstadoCuenta[]? Estado);

    // Lo que el administrador mira antes de decidir sobre una cuenta: cuánto trabaja el profesional y qué pasó con su estado.
    public record ActividadPsicopedagogo(int PacientesActivos, DateTime? UltimaActividad, DateTime? FechaAprobacion, string? Motivo);

    public interface IPsicopedagogoRepository
    {
        // Resumen de actividad de varios profesionales de una vez (un id sin actividad no aparece en el diccionario).
        Task<IReadOnlyDictionary<int, ActividadPsicopedagogo>> GetActividadAsync(IReadOnlyCollection<int> psicopedagogoIds, CancellationToken ct = default);
        Task<(IReadOnlyList<Psicopedagogo> Items, int TotalCount)> GetAllPsicopedagogosAsync(PsicopedagogoSearchFilter filter, int skip, int take, CancellationToken ct = default);
        Task<Psicopedagogo> AddPsicopedagogoAsync(Psicopedagogo psicopedagogo, CancellationToken ct = default);
        Task<Psicopedagogo?> GetByPsicopedagogoIdAsync(int id, CancellationToken ct = default);
        // Para validar el perfil: ¿otra persona ya usa este correo / documento?
        Task<bool> EmailTakenByOtherAsync(int personaId, string correoElectronico, CancellationToken ct = default);
        Task<bool> DocumentoTakenByOtherAsync(int personaId, string documento, CancellationToken ct = default);
        // Para validar el registro: la matrícula es única entre los profesionales.
        Task<bool> MatriculaTakenAsync(string matricula, CancellationToken ct = default);
        Task<Psicopedagogo?> GetForUpdateAsync(int psicopedagogoId, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
    }
}
