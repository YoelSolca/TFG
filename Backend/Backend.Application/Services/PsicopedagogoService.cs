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


        public async Task<Result<PerfilDto>> GetPerfilAsync(CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int id)
            {
                return Result<PerfilDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var psicopedagogo = await repository.GetByPsicopedagogoIdAsync(id, ct);

            return psicopedagogo is null
                ? Result<PerfilDto>.Failure("No se encontró tu perfil.", ErrorCodes.NotFound)
                : Result<PerfilDto>.Success(PerfilDto.FromEntity(psicopedagogo));
        }

        public async Task<Result<PerfilDto>> UpdatePerfilAsync(UpdatePerfilRequest request, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int id)
            {
                return Result<PerfilDto>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var psicopedagogo = await repository.GetForUpdateAsync(id, ct);
            if (psicopedagogo is null)
            {
                return Result<PerfilDto>.Failure("No se encontró tu perfil.", ErrorCodes.NotFound);
            }

            var persona = psicopedagogo.Persona;
            var usuario = persona.Usuario;

            var correo = request.CorreoElectronico.Trim().ToLowerInvariant();
            var documento = request.Documento.Trim();
            var telefono = new string(request.Telefono.Where(char.IsDigit).ToArray());

            if (telefono.Length is < 8 or > 13)
            {
                return Result<PerfilDto>.Failure("Teléfono inválido.", ErrorCodes.ValidationError);
            }

            if (request.FechaNacimiento > DateOnly.FromDateTime(DateTime.Today))
            {
                return Result<PerfilDto>.Failure("La fecha de nacimiento no puede ser futura.", ErrorCodes.ValidationError);
            }

            // El correo es con lo que se entra y se recupera la cuenta: para cambiarlo hay que confirmar la contraseña.
            if (!string.Equals(usuario.CorreoElectronico, correo, StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrEmpty(request.ContraseniaActual) || !contraseniaHasher.Verify(request.ContraseniaActual, usuario.Contrasenia))
                {
                    return Result<PerfilDto>.Failure("Para cambiar el correo ingresá tu contraseña actual.", ErrorCodes.InvalidCredentials);
                }

                if (await repository.EmailTakenByOtherAsync(id, correo, ct))
                {
                    return Result<PerfilDto>.Failure("Ese correo electrónico ya está en uso.", ErrorCodes.EmailTaken);
                }
            }

            if (documento != persona.Documento && await repository.DocumentoTakenByOtherAsync(id, documento, ct))
            {
                return Result<PerfilDto>.Failure("Ya existe una persona registrada con ese documento.", ErrorCodes.Duplicate);
            }

            persona.Nombre = request.Nombre.Trim();
            persona.Apellido = request.Apellido.Trim();
            persona.Documento = documento;
            persona.Genero = request.Genero;
            persona.FechaNacimiento = request.FechaNacimiento;
            psicopedagogo.Telefono = telefono;
            usuario.CorreoElectronico = correo;

            await repository.SaveChangesAsync(ct);

            logger.LogInformation("Perfil del psicopedagogo {PsicopedagogoId} actualizado.", id);
            return Result<PerfilDto>.Success(PerfilDto.FromEntity(psicopedagogo));
        }

        public async Task<Result<bool>> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default)
        {
            if (usuarioActual.PsicopedagogoId is not int id)
            {
                return Result<bool>.Failure("No hay una sesión activa.", ErrorCodes.Unauthorized);
            }

            var psicopedagogo = await repository.GetForUpdateAsync(id, ct);
            if (psicopedagogo is null)
            {
                return Result<bool>.Failure("No se encontró tu perfil.", ErrorCodes.NotFound);
            }

            var usuario = psicopedagogo.Persona.Usuario;

            if (!contraseniaHasher.Verify(request.ContraseniaActual, usuario.Contrasenia))
            {
                return Result<bool>.Failure("La contraseña actual es incorrecta.", ErrorCodes.InvalidCredentials);
            }

            if (request.NuevaContrasenia == request.ContraseniaActual)
            {
                return Result<bool>.Failure("La nueva contraseña debe ser distinta de la actual.", ErrorCodes.ValidationError);
            }

            usuario.Contrasenia = contraseniaHasher.Hash(request.NuevaContrasenia);
            // Si había un enlace de recuperación pendiente, deja de servir.
            usuario.TokenRestablecimiento = null;
            usuario.FechaExpiracionTokenRestablecimiento = DateTime.MinValue;

            await repository.SaveChangesAsync(ct);

            logger.LogInformation("El psicopedagogo {PsicopedagogoId} cambió su contraseña.", id);
            return Result<bool>.Success(true);
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
