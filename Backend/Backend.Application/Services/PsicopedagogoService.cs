using Backend.Application.Common;
using Backend.Application.DTO;
using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Backend.Application.Services
{
    public class PsicopedagogoService(
        IPsicopedagogoRepository repository,
        IPasswordHasher contraseniaHasher,
        IUsuarioActual usuarioActual,
        ILogger<PsicopedagogoService> logger): IPsicopedagogoService
    {
        private const int MaxPageSize = 50;

        public async Task<PagedResponse<PsicopedagogoDto>> GetPsicopedagogosAsync(PsicopedagogoSearchCriteria criteria, CancellationToken ct = default)
        {
            var page = Math.Max(criteria.Page, 1);
            var pageSize = Math.Clamp(criteria.PageSize, 1, MaxPageSize);


            var (items, total) = await repository.GetAllPsicopedagogosAsync(
                new PsicopedagogoSearchFilter (criteria.SearchTerm, criteria.Estado),
                (page - 1) * pageSize,
                pageSize,
                ct);

            return new PagedResponse<PsicopedagogoDto>(items.Select(PsicopedagogoDto.FromEntity).ToList(), total, page, pageSize);
        }


        public async Task<Result<PsicopedagogoDto>> CreatepsicopedagogoAsync(CreatePsicopedagogoRequest request, CancellationToken ct = default)
        {
            var psicopedagogo = new Psicopedagogo
            {
                Telefono = request.Telefono,
                Matricula = request.Matricula,
                Persona = new Persona
                {
                    Nombre = request.Nombre,
                    Apellido = request.Apellido,
                    Documento = request.Documento,
                    Genero = request.Genero,
                    FechaNacimiento = request.FechaNacimiento,
                    Usuario = new Usuario
                    {
                        CorreoElectronico = request.CorreoElectronico,
                        Contrasenia = contraseniaHasher.Hash(request.Contrasenia),
                        FechaAlta = DateTime.Now,
                        AceptoTerminos = request.AceptoTerminos,
                        FechaAceptacionTerminos = DateTime.Now,
                        Rol = RolUsuario.Psicopedagogo,
                        FechaSolicitud = DateTime.Now,
                    }
                }
            };

            await repository.AddPsicopedagogoAsync(psicopedagogo, ct);
            logger.LogInformation("Creado psicopedagogo {PsicopedagogoId}", psicopedagogo.PersonaId);
            return Result<PsicopedagogoDto>.Success(PsicopedagogoDto.FromEntity(psicopedagogo));
        }

        public async Task<Result<PsicopedagogoDto>> GetByPsicopedagogoIdAsync(int psicopedagogoId, CancellationToken ct = default)
        {
            var psicopedagogo = await repository.GetByPsicopedagogoIdAsync(psicopedagogoId, ct);
             
           
            return psicopedagogo is null
                ? Result<PsicopedagogoDto>.Failure($"Psicopedagogo con el id {psicopedagogoId} no fue encontrado.")
                : Result<PsicopedagogoDto>.Success(PsicopedagogoDto.FromEntity(psicopedagogo));
        }


        public async Task<Result<PsicopedagogoDto>> UpdateAsync(int psicopedagogoId, UpsertPsicopedagogoRequest request, CancellationToken ct = default)
        {
            var existing = await repository.GetByPsicopedagogoIdAsync(psicopedagogoId, ct);

            if(existing is null)
            {
                return Result<PsicopedagogoDto>.Failure($"Psicopedagogo con el id {psicopedagogoId} no fue encontrado.");
            }

            var psicopedagogo = new Psicopedagogo
            {
                PersonaId = psicopedagogoId,
                Avatar = request.Avatar,

                Persona = new Persona
                {
                    Usuario = new Usuario
                    {
                        CorreoElectronico = request.CorreoElectronico,
                        Contrasenia = contraseniaHasher.Hash(request.Contrasenia)
                    }
                }
            };

            await repository.UpdateAsync(psicopedagogo, ct);

            logger.LogInformation("Psicopedagogo con id {PsicopedagogoId} actualizado exitosamente.", psicopedagogoId);
            return Result<PsicopedagogoDto>.Success( PsicopedagogoDto.FromEntity(psicopedagogo));
        }

        public async Task<Result<PsicopedagogoDto>> UpdateStateAsync(int psicopedagogoId, UpdateStateRequest request, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int adminId)
            {
                return Result<PsicopedagogoDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var psicopedagogo = await repository.GetForUpdateAsync(psicopedagogoId, ct);

            if (psicopedagogo is null)
            {
                return Result<PsicopedagogoDto>.Failure($"Psicopedagogo con el id {psicopedagogoId} no fue encontrado.");
            }

            var usuario = psicopedagogo.Persona.Usuario;
            usuario.Historial.Add(new HistorialEstadoCuenta
            {
                AdministradorId = adminId,
                EstadoAnterior = usuario.Estado,
                EstadoNuevo = request.Estado,
                Motivo = request.Motivo,
                Fecha = DateTime.Now
            });
            usuario.Estado = request.Estado;

            await repository.SaveChangesAsync(ct);

            logger.LogInformation("Psicopedagogo con id {PsicopedagogoId} pasó a estado {Estado}.", psicopedagogoId, request.Estado);
            return Result<PsicopedagogoDto>.Success(PsicopedagogoDto.FromEntity(psicopedagogo));
        }
    }
}
