using Backend.Domain.Entities;
using System.Text.Json.Serialization;

namespace Backend.Domain.Interfaces
{

    public record PsicopedagogoSearchFilter(string? SearchTerm, [property: JsonConverter(typeof(JsonStringEnumConverter))] EstadoCuenta[]? Estado);

    public interface IPsicopedagogoRepository
    {
        Task<(IReadOnlyList<Psicopedagogo> Items, int TotalCount)> GetAllPsicopedagogosAsync(PsicopedagogoSearchFilter filter, int skip, int take, CancellationToken ct = default);
        Task<Psicopedagogo> AddPsicopedagogoAsync(Psicopedagogo psicopedagogo, CancellationToken ct = default);
        Task<Psicopedagogo?> GetByPsicopedagogoIdAsync(int id, CancellationToken ct = default);
        // Para validar el perfil: ¿otra persona ya usa este correo / documento?
        Task<bool> EmailTakenByOtherAsync(int personaId, string correoElectronico, CancellationToken ct = default);
        Task<bool> DocumentoTakenByOtherAsync(int personaId, string documento, CancellationToken ct = default);
        Task<Psicopedagogo?> GetForUpdateAsync(int psicopedagogoId, CancellationToken ct = default);
        Task SaveChangesAsync(CancellationToken ct = default);
    }
}
