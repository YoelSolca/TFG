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

            var actividad = await repository.GetActividadAsync(items.Select(p => p.PersonaId).ToList(), ct);
            var dtos = items.Select(p => PsicopedagogoDto.FromEntity(p, actividad.GetValueOrDefault(p.PersonaId))).ToList();

            return new PagedResponse<PsicopedagogoDto>(dtos, total, page, pageSize);
        }


        public async Task<Result<PsicopedagogoDto>> CreatepsicopedagogoAsync(CreatePsicopedagogoRequest request, CancellationToken ct = default)
        {
            var correo = request.CorreoElectronico.Trim().ToLowerInvariant();
            var documento = request.Documento.Trim();
            var matricula = request.Matricula.Trim();

            // El correo, el documento y la matrícula son únicos en la base: se avisa con un mensaje claro (409)
            // en vez de dejar que la base rechace el alta con un error interno (500).
            if (await repository.EmailTakenByOtherAsync(0, correo, ct))
            {
                return Result<PsicopedagogoDto>.Failure("Ya existe una cuenta con ese correo electrónico.", ErrorCodes.EmailTaken);
            }

            if (await repository.DocumentoTakenByOtherAsync(0, documento, ct))
            {
                return Result<PsicopedagogoDto>.Failure("Ya existe una persona registrada con ese documento.", ErrorCodes.Duplicate);
            }

            if (await repository.MatriculaTakenAsync(matricula, ct))
            {
                return Result<PsicopedagogoDto>.Failure("Ya existe un profesional registrado con esa matrícula.", ErrorCodes.Duplicate);
            }

            var psicopedagogo = new Psicopedagogo
            {
                Telefono = request.Telefono,
                Matricula = matricula,
                Persona = new Persona
                {
                    Nombre = request.Nombre,
                    Apellido = request.Apellido,
                    Documento = documento,
                    Genero = request.Genero,
                    FechaNacimiento = request.FechaNacimiento,
                    Usuario = new Usuario
                    {
                        CorreoElectronico = correo,
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
             
           
            if (psicopedagogo is null)
            {
                return Result<PsicopedagogoDto>.Failure($"Psicopedagogo con el id {psicopedagogoId} no fue encontrado.", ErrorCodes.NotFound);
            }

            var actividad = await repository.GetActividadAsync([psicopedagogoId], ct);
            return Result<PsicopedagogoDto>.Success(PsicopedagogoDto.FromEntity(psicopedagogo, actividad.GetValueOrDefault(psicopedagogoId)));
        }


        public async Task<Result<PerfilDto>> GetPerfilAsync(CancellationToken ct = default)
        {
            var psicopedagogo = await repository.GetByPsicopedagogoIdAsync(usuarioActual.UserId, ct);

            return psicopedagogo is null
                ? Result<PerfilDto>.Failure("No se encontró tu perfil.", ErrorCodes.NotFound)
                : Result<PerfilDto>.Success(PerfilDto.FromEntity(psicopedagogo));
        }

        public async Task<Result<PerfilDto>> UpdatePerfilAsync(UpdatePerfilRequest request, CancellationToken ct = default)
        {
            var psicopedagogo = await repository.GetForUpdateAsync(usuarioActual.UserId, ct);
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

                if (await repository.EmailTakenByOtherAsync(usuarioActual.UserId, correo, ct))
                {
                    return Result<PerfilDto>.Failure("Ese correo electrónico ya está en uso.", ErrorCodes.EmailTaken);
                }
            }

            if (documento != persona.Documento && await repository.DocumentoTakenByOtherAsync(usuarioActual.UserId, documento, ct))
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

            logger.LogInformation("Perfil del psicopedagogo {PsicopedagogoId} actualizado.", usuarioActual.UserId);
            return Result<PerfilDto>.Success(PerfilDto.FromEntity(psicopedagogo));
        }

        public async Task<Result<bool>> ChangePasswordAsync(ChangePasswordRequest request, CancellationToken ct = default)
        {
            var psicopedagogo = await repository.GetForUpdateAsync(usuarioActual.UserId, ct);
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

            logger.LogInformation("El psicopedagogo {PsicopedagogoId} cambió su contraseña.", usuarioActual.UserId);
            return Result<bool>.Success(true);
        }

        public async Task<Result<PsicopedagogoDto>> UpdateStateAsync(int psicopedagogoId, UpdateStateRequest request, CancellationToken ct = default)
        {

            var psicopedagogo = await repository.GetForUpdateAsync(psicopedagogoId, ct);

            if (psicopedagogo is null)
            {
                return Result<PsicopedagogoDto>.Failure($"Psicopedagogo con el id {psicopedagogoId} no fue encontrado.");
            }

            var usuario = psicopedagogo.Persona.Usuario;
            usuario.Historial.Add(new HistorialEstadoCuenta
            {
                AdministradorId = usuarioActual.UserId,
                EstadoAnterior = usuario.Estado,
                EstadoNuevo = request.Estado,
                Motivo = request.Motivo,
                Fecha = DateTime.Now
            });
            usuario.Estado = request.Estado;

            await repository.SaveChangesAsync(ct);

            logger.LogInformation("Psicopedagogo con id {PsicopedagogoId} pasó a estado {Estado}.", psicopedagogoId, request.Estado);
            var actividad = await repository.GetActividadAsync([psicopedagogoId], ct);
            return Result<PsicopedagogoDto>.Success(PsicopedagogoDto.FromEntity(psicopedagogo, actividad.GetValueOrDefault(psicopedagogoId)));
        }
    }
}
