using Backend.Application.Interfaces;
using Backend.Infrastructure.Security;

namespace Backend.Api.Security
{
    public class UsuarioActual (IHttpContextAccessor accessor) : IUsuarioActual
    {
        public int UserId
        {
            get
            {
                var value = accessor.HttpContext?.User.FindFirst(JwtTokenGenerator.UserClaim)?.Value;
                return int.TryParse(value, out var id) ? id : throw new Exception("No se pudo obtener el ID del Usuario del token.");
            }
        }
    }
}