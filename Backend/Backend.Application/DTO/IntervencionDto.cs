using Backend.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace Backend.Application.DTO;

public record IntervencionDto(string? Objetivo, string? Observaciones)
{
    public static IntervencionDto FromEntity(Intervencion i) => new(i.objetivo, i.observaciones);
}

public record UpsertIntervencionRequest(
    [StringLength(500)] string? Objetivo,
    [StringLength(1000)] string? Observaciones
);
