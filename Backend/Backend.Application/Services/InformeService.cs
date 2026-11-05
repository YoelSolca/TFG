using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;

namespace Backend.Application.Services
{
    public class InformeService(
        IInformeRepository repository,
        IPacienteService pacienteService,
        IInformeGenerador generador,
        IUsuarioActual usuarioActual) : IInformeService
    {
        private const int MaxPageSize = 50;
        private const int MaxResumen = 500;

        public async Task<Result<PagedResponse<InformeListItemDto>>> GetAllAsync(InformeSearchCriteria criteria, DateTime? fecha, CancellationToken ct = default)
        {
            var page = Math.Max(criteria.Page, 1);
            var pageSize = Math.Clamp(criteria.PageSize, 1, MaxPageSize);

            var (items, total) = await repository.GetAllAsync(usuarioActual.UserId, criteria.NombreApellido, fecha, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<InformeListItemDto>>.Success(
                new PagedResponse<InformeListItemDto>(items.Select(InformeListItemDto.FromEntity).ToList(), total, page, pageSize));
        }

        public async Task<Result<InformeDetalleDto>> GetByIdAsync(int id, CancellationToken ct = default)
        {
            var informe = await repository.GetByIdAsync(id, usuarioActual.UserId, ct);
            return informe is null
                ? Result<InformeDetalleDto>.Failure("El informe no existe.", ErrorCodes.NotFound)
                : Result<InformeDetalleDto>.Success(InformeDetalleDto.FromEntity(informe));
        }

        public async Task<Result<InformeDto>> CreateAsync(int pacienteId, CreateInformeRequest request, CancellationToken ct = default)
        {
            var desde = request.PeriodoDesde.Date;
            var hasta = request.PeriodoHasta.Date;
            if (desde > hasta)
            {
                return Result<InformeDto>.Failure("La fecha de inicio no puede ser posterior a la de fin.", ErrorCodes.ValidationError);
            }

            // La ficha y la evolución del paciente los arma el servicio de pacientes (con la pertenencia al profesional incluida).
            var detalle = await pacienteService.GetDetalleAsync(pacienteId, ct);
            if (!detalle.IsSuccess)
            {
                return Result<InformeDto>.Failure("El paciente no existe.", ErrorCodes.NotFound);
            }

            var paciente = detalle.Value!;
            var evolucion = await pacienteService.GetEvolucionAsync(pacienteId, desde, hasta, ct);
            var sesiones = CalculosEvolucion.ResumirSesiones(evolucion.Value!);


            var datos = new DatosInforme(
                EdadEn(paciente.FechaNacimiento, hasta),
                paciente.Genero,
                paciente.Objetivo,
                paciente.Observaciones,
                paciente.TiposDificultad.Select(t => t.Nombre).ToList(),
                DateOnly.FromDateTime(desde),
                DateOnly.FromDateTime(hasta),
                sesiones.Select(s => s.ToInforme()).ToList(),
                CalculosEvolucion.EjerciciosPorArea(sesiones),
                CalculosEvolucion.DondeMasCuesta(sesiones),
                CalculosEvolucion.CalcularConstancia(sesiones));


            InformeGenerado generado = await generador.GenerarAsync(datos, ct);
    

            var informe = new Informe
            {
                PacienteId = pacienteId,
                PsicopedagogoId = usuarioActual.UserId,
                FechaGeneracion = DateTime.Now,
                PeriodoDesde = desde,
                PeriodoHasta = hasta,
                Resumen = ResumenParaGuardar(generado),
                Contenido = generado.Contenido
            };

            var creado = await repository.AddAsync(informe, ct);
            return Result<InformeDto>.Success(InformeDto.FromEntity(creado));
        }

        // La columna Resumen es obligatoria y admite 500 caracteres: si el modelo no mandó resumen o se pasó, se ajusta.
        private static string ResumenParaGuardar(InformeGenerado generado)
        {
            var resumen = string.IsNullOrWhiteSpace(generado.Resumen) ? generado.Contenido : generado.Resumen;
            return resumen.Length <= MaxResumen ? resumen : resumen[..(MaxResumen - 3)].TrimEnd() + "...";
        }

        // Edad en años cumplidos a la fecha dada (el fin del período del informe).
        private static int EdadEn(DateOnly nacimiento, DateTime fecha)
        {
            var edad = fecha.Year - nacimiento.Year;
            if (DateOnly.FromDateTime(fecha) < nacimiento.AddYears(edad)) edad--;
            return Math.Max(edad, 0);
        }
    }
}
