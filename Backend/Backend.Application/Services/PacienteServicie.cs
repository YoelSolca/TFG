using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class PacienteService(
        IPacienteRepository repository,
        IInformeRepository informeRepository,
        IPersonaRepository personaRepository,
        IPsicopedagogoRepository psicopedagogoRepository,
        IUsuarioActual usuarioActual,
        ILogger<PacienteService> logger
        ) : IPacienteService
    {
        private const int MaxPageSize = 50;

        public async Task<Result<PagedResponse<PacienteListItemDto>>> GetPacientesAsync(string? search, int? tipoDificultadId, int page, int pageSize, CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

            var (items, total) = await repository.GetPacientesAsync(usuarioActual.UserId, search, tipoDificultadId, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<PacienteListItemDto>>.Success(
                new PagedResponse<PacienteListItemDto>(items.Select(p => PacienteListItemDto.FromEntity(p, usuarioActual.UserId)).ToList(), total, page, pageSize));
        }

        public async Task<IReadOnlyList<TipoDificultadDto>> GetTiposDificultadAsync(CancellationToken ct = default)
            => (await repository.GetTiposDificultadAsync(ct)).Select(TipoDificultadDto.FromEntity).ToList();

        public async Task<Result<PagedResponse<PacienteHistorialItemDto>>> GetHistorialAsync(int pacienteId, int? tipoEjercicioId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

            var (items, total) = await repository.GetHistorialAsync(pacienteId, usuarioActual.UserId, tipoEjercicioId, fecha, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<PacienteHistorialItemDto>>.Success(
                new PagedResponse<PacienteHistorialItemDto>(items.Select(PacienteHistorialItemDto.FromEntity).ToList(), total, page, pageSize));
        }

        public async Task<Result<IReadOnlyList<SesionEvolucionDto>>> GetEvolucionAsync(int pacienteId, DateTime? desde, DateTime? hasta, CancellationToken ct = default)
        {
            if (desde is DateTime d && hasta is DateTime h && d.Date > h.Date)
            {
                return Result<IReadOnlyList<SesionEvolucionDto>>.Failure("La fecha de inicio no puede ser posterior a la de fin.", ErrorCodes.ValidationError);
            }

            // Sin paginar: el gráfico y el informe necesitan todas las sesiones del período.
            var ejercicios = await repository.GetEvolucionAsync(pacienteId, usuarioActual.UserId, desde, hasta, ct);

            return Result<IReadOnlyList<SesionEvolucionDto>>.Success(SesionEvolucionDto.Agrupar(ejercicios));
        }

        public async Task<Result<PagedResponse<PacienteInformeItemDto>>> GetInformesAsync(int pacienteId, DateTime? fecha, int page, int pageSize, CancellationToken ct = default)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

            var (items, total) = await informeRepository.GetByPacienteAsync(pacienteId, usuarioActual.UserId, fecha, (page - 1) * pageSize, pageSize, ct);

            return Result<PagedResponse<PacienteInformeItemDto>>.Success(
                new PagedResponse<PacienteInformeItemDto>(items.Select(PacienteInformeItemDto.FromEntity).ToList(), total, page, pageSize));
        }

        public async Task<Result<PacienteDetalleDto>> GetDetalleAsync(int pacienteId, CancellationToken ct = default)
        {
            var atencion = await repository.GetDetalleAsync(pacienteId, usuarioActual.UserId, ct);
            if (atencion is null)
            {
                return Result<PacienteDetalleDto>.Failure($"El paciente con ID {pacienteId} no fue encontrado.", ErrorCodes.NotFound);
            }

            var ultimaSesion = await repository.GetUltimaSesionAsync(pacienteId, usuarioActual.UserId, ct);
            return Result<PacienteDetalleDto>.Success(PacienteDetalleDto.FromEntity(atencion, ultimaSesion));
        }

        public async Task<Result<RegistroPacienteResult>> CreatePacienteAsync(CreatePacienteRequest request, CancellationToken ct = default)
        {
            if (await psicopedagogoRepository.GetByPsicopedagogoIdAsync(usuarioActual.UserId, ct) is null)
            {
                return Result<RegistroPacienteResult>.Failure($"El psicopedagogo con ID {usuarioActual.UserId} no fue encontrado.", ErrorCodes.NotFound);
            }

            var documento = request.Documento.Trim();
            if (documento.Length == 0 || string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Apellido) || string.IsNullOrWhiteSpace(request.Direccion))
            {
                return Result<RegistroPacienteResult>.Failure("Nombre, apellido, documento y dirección son obligatorios.", ErrorCodes.ValidationError);
            }

            if (request.FechaNacimiento == default || request.FechaNacimiento > DateOnly.FromDateTime(DateTime.Today))
            {
                return Result<RegistroPacienteResult>.Failure("La fecha de nacimiento es obligatoria y no puede ser futura.", ErrorCodes.ValidationError);
            }

            var tiposDificultadIds = request.TiposDificultadIds.Distinct().ToList();
            if (!await repository.TiposDificultadExistenAsync(tiposDificultadIds, ct))
            {
                return Result<RegistroPacienteResult>.Failure("Alguno de los tipos de dificultad indicados no existe.", ErrorCodes.ValidationError);
            }

            // El paciente es único en todo el sistema: si el documento ya existe no se duplica, solo se
            // vincula a este psicopedagogo. Los datos personales guardados no se sobrescriben.
            var existente = await repository.GetByDocumentoAsync(documento, ct);
            if (existente is not null)
            {
                var atencion = await repository.GetAtencionAsync(existente.PersonaId, usuarioActual.UserId, ct);

                // El mismo psicopedagogo intenta cargar un paciente que ya atiende: es un intento de duplicado.
                if (atencion is not null && atencion.FechaFin is null)
                {
                    return Result<RegistroPacienteResult>.Failure($"El paciente con documento {documento} ya está registrado en tu lista de pacientes.", ErrorCodes.Duplicate);
                }

                await IniciarOReactivarAtencionAsync(existente.PersonaId, usuarioActual.UserId, atencion, request.Objetivo, request.Observaciones, tiposDificultadIds, ct);

                logger.LogInformation("Paciente existente {Id} vinculado al psicopedagogo {PsicopedagogoId}", existente.PersonaId, usuarioActual.UserId);
                return Result<RegistroPacienteResult>.Success(new RegistroPacienteResult(PacienteDto.FromEntity(existente), false));
            }

            // El documento existe pero pertenece a alguien que no es paciente (ej. un psicopedagogo).
            if (await personaRepository.IdCardExistAsync(documento, ct: ct))
            {
                return Result<RegistroPacienteResult>.Failure($"El documento {documento} pertenece a otra persona registrada.", ErrorCodes.Duplicate);
            }

            var paciente = new Paciente
            {
                Direccion = request.Direccion.Trim(),
                FechaAlta = DateTime.Now,
                Persona = new Persona
                {
                    Nombre = request.Nombre.Trim(),
                    Apellido = request.Apellido.Trim(),
                    Documento = documento,
                    Genero = request.Genero,
                    FechaNacimiento = request.FechaNacimiento
                },

                PsicopedagogoPacientes = new List<PsicopedagogoPaciente>
                {
                    new()
                    {
                        PsicopedagogoId = usuarioActual.UserId,
                        FechaInicio = DateTime.Now,
                        Intervencion = new Intervencion
                        {
                            objetivo = request.Objetivo,
                            observaciones = request.Observaciones,
                            TiposDificultad = tiposDificultadIds.Select(id => new IntervencionTipoDificultad { TipoDificultadId = id }).ToList()
                        }
                    }
                }

            };


            await repository.AddPacienteAsync(paciente, ct);

            logger.LogInformation("Paciente creado: {Id} ({documento})", paciente.PersonaId, paciente.Persona.Documento);
            return Result<RegistroPacienteResult>.Success(new RegistroPacienteResult(PacienteDto.FromEntity(paciente), true));
        }

        public async Task<Result<IntervencionDto>> GetIntervencionAsync(int pacienteId, int psicopedagogoId, CancellationToken ct = default)
        {
            var intervencion = await repository.GetIntervencionAsync(pacienteId, psicopedagogoId, ct);

            return intervencion is null
                ? Result<IntervencionDto>.Failure($"El psicopedagogo {psicopedagogoId} no atiende ni atendió al paciente {pacienteId}.", ErrorCodes.NotFound)
                : Result<IntervencionDto>.Success(IntervencionDto.FromEntity(intervencion));
        }

        public async Task<Result<IntervencionDto>> UpdateIntervencionAsync(int pacienteId, UpsertIntervencionRequest request, CancellationToken ct = default)
        {
            if (!await repository.UpdateIntervencionAsync(pacienteId, usuarioActual.UserId, request.Objetivo, request.Observaciones, ct))
            {
                return Result<IntervencionDto>.Failure($"El psicopedagogo {usuarioActual.UserId} no atiende ni atendió al paciente {pacienteId}.", ErrorCodes.NotFound);
            }

            logger.LogInformation("Intervención actualizada: paciente {PacienteId}, psicopedagogo {PsicopedagogoId}", pacienteId, usuarioActual.UserId);
            return Result<IntervencionDto>.Success(new IntervencionDto(request.Objetivo, request.Observaciones));
        }

        public async Task<Result<PacienteDto>> UpdatePacienteAsync(int pacienteId, UpsertPacienteRequest request, CancellationToken ct = default)
        {
            var paciente = await repository.GetForUpdateAsync(pacienteId, ct);

            if (paciente is null)
            {
                return Result<PacienteDto>.Failure($"El paciente con ID {pacienteId} no fue encontrado.", ErrorCodes.NotFound);
            }

            if (await personaRepository.IdCardExistAsync(request.Documento, excludedId: pacienteId, ct: ct))
            {
                return Result<PacienteDto>.Failure($"El documento {request.Documento} pertenece a otra persona.", ErrorCodes.Duplicate);
            }

            var atencion = paciente.PsicopedagogoPacientes.FirstOrDefault(p => p.PsicopedagogoId == usuarioActual.UserId);

            if (atencion is null)
                return Result<PacienteDto>.Failure("El psicopedagogo no atiende a este paciente", ErrorCodes.NotFound);

            var tiposDificultadIds = request.TiposDificultadIds.Distinct().ToList();
            if (!await repository.TiposDificultadExistenAsync(tiposDificultadIds, ct))
            {
                return Result<PacienteDto>.Failure("Algún tipo de dificultad no existe.", ErrorCodes.NotFound);
            }

            // Las dificultades quedan exactamente las pedidas: se sacan las que ya no están y se suman las nuevas.
            var tiposActuales = atencion.Intervencion.TiposDificultad;
            foreach (var quitado in tiposActuales.Where(t => !tiposDificultadIds.Contains(t.TipoDificultadId)).ToList())
            {
                tiposActuales.Remove(quitado);
            }
            foreach (var id in tiposDificultadIds.Where(id => tiposActuales.All(t => t.TipoDificultadId != id)))
            {
                tiposActuales.Add(new IntervencionTipoDificultad { TipoDificultadId = id });
            }

            paciente.Direccion = request.Direccion;
            paciente.Persona.Nombre = request.Nombre;
            paciente.Persona.Apellido = request.Apellido;
            paciente.Persona.Documento = request.Documento;
            paciente.Persona.Genero = request.Genero;
            paciente.Persona.FechaNacimiento = request.FechaNacimiento;
            atencion.Intervencion.objetivo = request.Objetivo;
            atencion.Intervencion.observaciones = request.Observaciones;


            await repository.UpdateAsync(paciente, ct);
            logger.LogInformation("Paciente actualizado: {Id} ({documento})", paciente.PersonaId, paciente.Persona.Documento);
            return Result<PacienteDto>.Success(PacienteDto.FromEntity(paciente));

        }

        /// <summary>Crea la atención con su intervención vacía o inicial; si ya existió y estaba finalizada, la reabre con su mismo historial.</summary>
        private async Task IniciarOReactivarAtencionAsync(int pacienteId, int psicopedagogoId, PsicopedagogoPaciente? atencion, string? objetivo, string? observaciones, IReadOnlyList<int> tiposDificultadIds, CancellationToken ct)
        {
            if (atencion is null)
            {
                await repository.IniciarAtencionAsync(new PsicopedagogoPaciente
                {
                    PacienteId = pacienteId,
                    PsicopedagogoId = psicopedagogoId,
                    FechaInicio = DateTime.Now,
                    Intervencion = new Intervencion
                    {
                        objetivo = objetivo,
                        observaciones = observaciones,
                        TiposDificultad = tiposDificultadIds.Select(id => new IntervencionTipoDificultad { TipoDificultadId = id }).ToList()
                    }
                }, ct);
            }
            else if (atencion.FechaFin is not null)
            {
                await repository.ReactivarAtencionAsync(pacienteId, psicopedagogoId, ct);
            }
        }

    }
}
