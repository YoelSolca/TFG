namespace Backend.Application.Interfaces
{
    public interface IEmailSender
    {
        // Envía el correo con el enlace para restablecer la contraseña. Lanza una excepción si no se pudo enviar.
        Task SendPasswordResetAsync(string correoDestino, string nombre, string token, DateTime venceEl, CancellationToken ct = default);
    }
}
