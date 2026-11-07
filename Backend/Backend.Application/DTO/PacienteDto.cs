using Backend.Domain.Entities;
using System.ComponentModel.DataAnnotations;


namespace Backend.Application.DTO;

public record PacienteDto(int personaId, DateTime FechaAlta)
{
    public static PacienteDto FromEntity(Paciente p) => new(p.PersonaId, p.FechaAlta);
}

public record PacienteListItemDto(int Id, string Nombre, string Apellido, string Documento, DateOnly FechaNacimiento, IReadOnlyList<string> TiposDificultad)
{
    // Las dificultades son las que trabaja ESTE profesional con el paciente (el paciente puede tener otras atenciones).
    public static PacienteListItemDto FromEntity(Paciente p, int psicopedagogoId) => new(
        p.PersonaId, p.Persona.Nombre, p.Persona.Apellido, p.Persona.Documento, p.Persona.FechaNacimiento!.Value,
        p.PsicopedagogoPacientes
            .Where(pp => pp.PsicopedagogoId == psicopedagogoId)
            .SelectMany(pp => pp.Intervencion.TiposDificultad)
            .Select(t => t.TipoDificultad.Nombre)
            .ToList());
}

public record TipoDificultadDto(int Id, string Nombre)
{
    public static TipoDificultadDto FromEntity(TipoDificultad t) => new(t.Id, t.Nombre);
}

public record TipoEjercicioDto (int Id, string Nombre)
{
    public static TipoEjercicioDto FromEntity(TipoEjercicio t) => new(t.Id, t.Nombre);
}

public record PacienteDetalleDto(
    int Id, string Nombre, string Apellido, string Documento, DateOnly FechaNacimiento,
    string Genero,
    string? Objetivo, string? Observaciones, IReadOnlyList<TipoDificultadDto> TiposDificultad, UltimaSesionDto? UltimaSesion)
{
    public static PacienteDetalleDto FromEntity(PsicopedagogoPaciente atencion, Sesion? ultimaSesion) => new(
        atencion.PacienteId, atencion.Paciente.Persona.Nombre, atencion.Paciente.Persona.Apellido, atencion.Paciente.Persona.Documento,
        atencion.Paciente.Persona.FechaNacimiento!.Value, atencion.Paciente.Persona.Genero!,
        atencion.Intervencion.objetivo, atencion.Intervencion.observaciones,
        atencion.Intervencion.TiposDificultad.Select(t => TipoDificultadDto.FromEntity(t.TipoDificultad)).ToList(),
        ultimaSesion is null ? null : UltimaSesionDto.FromEntity(ultimaSesion));
}

public record PacienteHistorialItemDto(
    int SesionId, int EjercicioId, DateTime Fecha,
    string TipoEjercicio, string Ejercicio,
    int Aciertos, int Errores, int? TiempoSegundos,
    string? Observaciones,
    IReadOnlyList<MetricaValorDto> Metricas)
{
    // Solo para ejercicios con resultado: el repositorio no trae los demás.
    public static PacienteHistorialItemDto FromEntity(SesionEjercicio se) => new(
        se.Sesion.Id, se.EjercicioId, se.Sesion.Fecha,
        se.Ejercicio.TipoEjercicio.Nombre, se.Ejercicio.Nombre,
        se.Resultado!.Aciertos, se.Resultado.Errores, se.Resultado.TiempoSegundos, se.Resultado.Observaciones,
        se.Resultado.ResultadoMetricas.Select(m => new MetricaValorDto(m.Metrica.Nombre, m.Valor, m.Metrica.Unidad)).ToList());
}

public record EjercicioEvolucionDto(
    int EjercicioId, string Ejercicio, int TipoEjercicioId, string TipoEjercicio,
    int Aciertos, int Errores, string? Observaciones, int? TiempoSegundos, int? Pistas)
{
    public static EjercicioEvolucionDto FromEntity(SesionEjercicio se) => new(
        se.EjercicioId, se.Ejercicio.Nombre, se.Ejercicio.TipoEjercicioId, se.Ejercicio.TipoEjercicio.Nombre,
        se.Resultado!.Aciertos, se.Resultado.Errores, se.Resultado.Observaciones, se.Resultado.TiempoSegundos,
        // La métrica "pistas" solo existe en los ejercicios que la registran: si no está, es null (no es cero).
        se.Resultado.ResultadoMetricas
            .Where(m => m.Metrica.Nombre == "pistas")
            .Select(m => (int?)decimal.ToInt32(m.Valor))
            .FirstOrDefault());
}

public record SesionEvolucionDto(
    int SesionId, DateTime Fecha,
    IReadOnlyList<EjercicioEvolucionDto> Ejercicios)
{
    // Los ejercicios vienen ordenados por sesión: se juntan los de cada sesión, respetando ese orden.
    public static IReadOnlyList<SesionEvolucionDto> Agrupar(IEnumerable<SesionEjercicio> ejercicios) => ejercicios
        .GroupBy(se => new { se.SesionId, se.Sesion.Fecha })
        .Select(g => new SesionEvolucionDto(g.Key.SesionId, g.Key.Fecha, g.Select(EjercicioEvolucionDto.FromEntity).ToList()))
        .ToList();
}

public record PacienteInformeItemDto(
    int Id, int PacienteId, DateTime FechaGeneracion,
    int PsicopedagogoId,
     string contenido, DateTime PeriodoDesde, DateTime PeriodoHasta, string Resumen)
{
    public static PacienteInformeItemDto FromEntity(Informe i) => new(
        i.Id, i.PacienteId, i.FechaGeneracion, i.PsicopedagogoId, i.Contenido, i.PeriodoDesde, i.PeriodoHasta, i.Resumen);
}
public record MetricaValorDto(string Nombre, decimal Valor, string? Unidad);


public record UltimaSesionDto(int Id, DateTime Fecha, IReadOnlyList<string> TiposEjercicio)
{
    // Los tipos van ordenados por nombre: así el resultado no depende del orden en que la base devuelva las filas.
    public static UltimaSesionDto FromEntity(Sesion s) => new(
        s.Id, s.Fecha, s.SesionEjercicios.Select(se => se.Ejercicio.TipoEjercicio.Nombre).Distinct().Order().ToList());
}

public record PagedResponse<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

public record RegistroPacienteResult(PacienteDto Paciente, bool Creado);

// El psicopedagogo sale del token y la fecha de alta la pone el servidor, por eso no vienen en el request.
public record CreatePacienteRequest(
    [Required, StringLength(100)] string Nombre,
    [Required, StringLength(100)] string Apellido,
    [Required, StringLength(20)] string Documento,
    [Required, RegularExpression("^[MFO]$")] string Genero,
    DateOnly FechaNacimiento,
    [StringLength(500)] string? Objetivo,
    [StringLength(1000)] string? Observaciones,
    [Required, MinLength(1)] IReadOnlyList<int> TiposDificultadIds
);
public record UpsertPacienteRequest(
    [Required, StringLength(100)] string Nombre,
    [StringLength(100)] string Apellido,
    [StringLength(20)] string Documento,
    [StringLength(1)] string Genero,
    DateOnly FechaNacimiento,
    [StringLength(500)] string? Objetivo,
    [StringLength(1000)] string? Observaciones,
    [Required, MinLength(1)] IReadOnlyList<int> TiposDificultadIds
    );
