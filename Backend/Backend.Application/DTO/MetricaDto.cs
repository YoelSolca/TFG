using Backend.Domain.Entities;
using System.Text.Json.Serialization;

namespace Backend.Application.DTO;

public record MetricaDto(
    int Id,
    string Nombre,
    string? Descripcion,
    string? Unidad,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] TipoAgregacion TipoAgregacion)
{
    public static MetricaDto FromEntity(Metrica m) => new(m.Id, m.Nombre, m.Descripcion, m.Unidad, m.TipoAgregacion);
}
