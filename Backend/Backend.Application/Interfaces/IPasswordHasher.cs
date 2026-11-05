using Backend.Domain.Entities;

namespace Backend.Application.Interfaces;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface ITokenGenerator
{
    (string Token, DateTime ExpiresAt) Generate(Usuario usuario);

    (string Token, DateTime ExpiresAt) GenerateResetToken();
}

public interface IUsuarioActual
{
    int UserId { get; }
}
