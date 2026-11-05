using System.Security.Cryptography;
using System.Text;

namespace Backend.Application.Common
{
    // El token de recuperación viaja solo en el correo: en la base se guarda su hash, no el token.
    // El token ya es aleatorio de 32 bytes, así que alcanza con SHA-256 (no hace falta sal).
    public static class ResetTokenHash
    {
        public static string Compute(string token)
            => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }
}
