using Backend.Application.Interfaces;
using Backend.Application.Options;
using Backend.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
namespace Backend.Infrastructure.Security
{
    public class JwtTokenGenerator(IOptions<JwtOptions> options) : ITokenGenerator
    {
        public const string UserClaim = "userId";
        // Con el rol dentro del token la API puede dejar los endpoints de administración solo para el administrador.
        public const string RolClaim = "rol";
        private readonly JwtOptions _options = options.Value;

        public (string Token, DateTime ExpiresAt) Generate(Usuario user)
        {
            var expiresAt = DateTime.Now.AddMinutes(_options.ExpirationMinutes);

            //que es esta linea de codigo?
            var credentials = new SigningCredentials(
                              new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key)),
                              SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims:
            [
                new Claim(UserClaim, user.PersonaId.ToString()),
                new Claim(RolClaim, user.Rol.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.CorreoElectronico)
            ],
            expires: expiresAt,
            signingCredentials: credentials);

            return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
        }

        public (string Token, DateTime ExpiresAt) GenerateResetToken()
        {
            var tokenData = RandomNumberGenerator.GetBytes(32);
            var token = Convert.ToBase64String(tokenData);
            var expiresAt = DateTime.Now.AddDays(_options.ResetTokenExpirationDays);
            return (token, expiresAt);
        }
    }
}
