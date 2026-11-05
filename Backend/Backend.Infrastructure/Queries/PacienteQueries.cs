using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Queries
{
    public class PacienteQueries(AppDbContext context) : IPacienteQueries
    {
        public async Task<PagedResponse<PacienteListItemDto>> GetPacientesAsync(int psicopedagogoId, string? search, int? tipoDificultadId, int page, int pageSize, CancellationToken ct = default)
        {
            var query = context.Paciente.AsNoTracking()
                                        .Where(p => p.PsicopedagogoPacientes.Any(pp => pp.PsicopedagogoId == psicopedagogoId 
                                         && pp.FechaFin == null));

            if (!string.IsNullOrWhiteSpace(search)){
                var term = search.Trim();
                query = query.Where(p => p.Persona.Nombre.Contains(term)
                                      || p.Persona.Apellido.Contains(term)
                                      || p.Persona.Documento.Contains(term));
            }

            if (tipoDificultadId is int tipoId) {
                query = query.Where(p => p.PsicopedagogoPacientes.Any(pp => pp.PsicopedagogoId == psicopedagogoId
                                                                    && pp.Intervencion.TiposDificultad.Any(
                                                                    t => t.TipoDificultadId == tipoId)));
            }

            var total = await query.CountAsync(ct);

            var items = await query
                .OrderBy(p => p.Persona.Apellido)
                .ThenBy(p => p.Persona.Nombre)
                .ThenBy(p => p.PersonaId)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new PacienteListItemDto(
                    p.PersonaId, p.Persona.Nombre, p.Persona.Apellido, p.Persona.Documento, p.Persona.FechaNacimiento!.Value,
                    p.PsicopedagogoPacientes
                        .Where(pp => pp.PsicopedagogoId == psicopedagogoId)
                        .SelectMany(pp => pp.Intervencion.TiposDificultad)
                        .Select(t => t.TipoDificultad.Nombre)
                        .ToList()))
                .ToListAsync(ct);

            return new PagedResponse<PacienteListItemDto>(items, total, page, pageSize);
        }

        public async Task<PagedResponse<PacienteHistorialItemDto>> GetHistorialAsync(int pacienteId, int psicopedagogoId, int? tipoEjercicioId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default)
        {
            // El historial son los ejercicios ya realizados: los de una sesión planificada o en curso todavía no tienen resultado.
            var query = context.SesionEjercicio.AsNoTracking()
                        .Where(se => se.Resultado != null
                               && se.Sesion.PsicopedagogoPaciente.PsicopedagogoId == psicopedagogoId
                               && se.Sesion.PsicopedagogoPaciente.PacienteId == pacienteId
                               && se.Sesion.PsicopedagogoPaciente.FechaFin == null);

            if (tipoEjercicioId is int tipoId)
                query = query.Where(s => s.Ejercicio.TipoEjercicioId == tipoEjercicioId);

            if (fecha is DateTime f)
                query = query.Where(s => s.Sesion.Fecha.Date == f.Date);

            var total = await query.CountAsync(ct);

            var items = await query.OrderByDescending(s => s.Sesion.Fecha)
                       .ThenByDescending(se => se.SesionId)
                       .Skip((page - 1) * pageSize)
                       .Take(pageSize)
                       .Select(se => new PacienteHistorialItemDto(
                           se.Sesion.Id,
                           se.EjercicioId,
                           se.Sesion.Fecha,
                           se.Ejercicio.TipoEjercicio.Nombre,
                           se.Ejercicio.Nombre,
                           se.Resultado!.Aciertos,
                           se.Resultado.Errores,
                           se.Resultado.TiempoSegundos,
                           se.Resultado.Observaciones,
                           se.Resultado.ResultadoMetricas.Select(m => new MetricaValorDto(m.Metrica.Nombre, m.Valor, m.Metrica.Unidad)).ToList()
                       )).ToListAsync(ct);


            return new PagedResponse<PacienteHistorialItemDto>(items, total, page, pageSize);
        }

        public async Task<IReadOnlyList<SesionSeguimientoDto>> GetSeguimientoAsync(int pacienteId, int psicopedagogoId, DateTime? desde, DateTime? hasta, CancellationToken ct = default)
        {
            // Igual que el historial, solo cuentan los ejercicios con resultado; sin paginar porque el gráfico necesita todo el período.
            var query = context.SesionEjercicio.AsNoTracking()
                        .Where(se => se.Resultado != null
                               && se.Sesion.PsicopedagogoPaciente.PsicopedagogoId == psicopedagogoId
                               && se.Sesion.PsicopedagogoPaciente.PacienteId == pacienteId
                               && se.Sesion.PsicopedagogoPaciente.FechaFin == null);

            if (desde is DateTime d)
                query = query.Where(se => se.Sesion.Fecha >= d.Date);

            if (hasta is DateTime h)
            {
                var finDelDia = h.Date.AddDays(1);
                query = query.Where(se => se.Sesion.Fecha < finDelDia);
            }

            var filas = await query
                .OrderBy(se => se.Sesion.Fecha)
                .ThenBy(se => se.SesionId)
                .ThenBy(se => se.Orden)
                .Select(se => new
                {
                    se.SesionId,
                    se.Sesion.Fecha,
                    Ejercicio = new EjercicioSeguimientoDto(
                        se.EjercicioId,
                        se.Ejercicio.Nombre,
                        se.Ejercicio.TipoEjercicioId,
                        se.Ejercicio.TipoEjercicio.Nombre,
                        se.Resultado!.Aciertos,
                        se.Resultado.Errores,
                        se.Resultado.Observaciones)
                })
                .ToListAsync(ct);

            return filas
                .GroupBy(f => new { f.SesionId, f.Fecha })
                .Select(g => new SesionSeguimientoDto(g.Key.SesionId, g.Key.Fecha, g.Select(f => f.Ejercicio).ToList()))
                .ToList();
        }

        public async Task<PagedResponse<PacienteInformeItemDto>> GetInformesAsync(int pacienteId, int psicopedagogoId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default)
        {
            var query = context.Informe.AsNoTracking()
                        .Where(i => i.PsicopedagogoId == psicopedagogoId
                               && i.PacienteId == pacienteId);

            if (fecha is DateTime f)
                query = query.Where(i => i.FechaGeneracion.Date == f.Date);

            var total = await query.CountAsync(ct);

            var items = await query.OrderByDescending(i => i.FechaGeneracion)
                       .Skip((page - 1) * pageSize)
                       .Take(pageSize)
                       .Select(i => new PacienteInformeItemDto(
                           i.Id,
                           i.PacienteId,
                           i.FechaGeneracion,
                           i.PsicopedagogoId,
                           i.Contenido,
                           i.PeriodoDesde,
                           i.PeriodoHasta
                       )).ToListAsync(ct);

            return new PagedResponse<PacienteInformeItemDto>(items, total, page, pageSize);
        }

        public async Task<PacienteDetalleDto?> GetDetalleAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
        {
            var atenciones = context.PsicopedagogoPaciente.AsNoTracking()
                                    .Where(x => x.PacienteId == pacienteId 
                                    && x.PsicopedagogoId == psicopedagogoId);

            var datos = await atenciones.Select(x => new
            {
                x.PacienteId,
                x.Paciente.Persona.Nombre,
                x.Paciente.Persona.Apellido,
                x.Paciente.Persona.Documento,
                x.Paciente.Persona.FechaNacimiento,
                x.Paciente.Persona.Genero,
                x.Paciente.Direccion,
                x.Intervencion.objetivo,
                x.Intervencion.observaciones
            }).FirstOrDefaultAsync(ct);

            if (datos is null) return null;

            var ultima = await atenciones.SelectMany(x => x.Sesiones)
                .OrderByDescending(s => s.Fecha)
                .Select(s => new
                {
                    s.Id,
                    s.Fecha,
                    Tipos = s.SesionEjercicios.Select(se => se.Ejercicio.TipoEjercicio.Nombre).Distinct().ToList()
                })
                .FirstOrDefaultAsync(ct);

            var dificultades = await atenciones.SelectMany(x => x.Intervencion.TiposDificultad)
                                               .Select(t => new TipoDificultadDto(t.TipoDificultad.Id, t.TipoDificultad.Nombre))
                                               .ToListAsync(ct);

            return new PacienteDetalleDto(datos.PacienteId, datos.Nombre, datos.Apellido, datos.Documento,
                datos.FechaNacimiento!.Value, datos.Direccion, datos.Genero!,
                datos.objetivo, datos.observaciones, dificultades,
                ultima is null ? null : new UltimaSesionDto(ultima.Id, ultima.Fecha, ultima.Tipos));
        }
    }
}
