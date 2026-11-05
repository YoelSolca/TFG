using System.Globalization;
using System.Net;
using Backend.Application.Interfaces;
using Backend.Application.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Backend.Infrastructure.Email
{
    public class SmtpEmailSender(IOptions<EmailOptions> options) : IEmailSender
    {
        private const string LogoContentId = "logo-psico";

        private readonly EmailOptions _options = options.Value;

        public async Task SendPasswordResetAsync(string correoDestino, string nombre, string token, DateTime venceEl, CancellationToken ct = default)
        {
            var baseUrl = _options.FrontendBaseUrl.TrimEnd('/');
            var enlace = $"{baseUrl}/restablecer-contrasena?token={Uri.EscapeDataString(token)}";
            var enlaceNuevo = $"{baseUrl}/recuperar";
            var vencimiento = venceEl.ToString("dd/MM/yyyy 'a las' HH:mm", CultureInfo.InvariantCulture);

            var html = Completar(await LeerTextoAsync("PasswordReset.html", ct), WebUtility.HtmlEncode(nombre), enlace, enlaceNuevo, vencimiento);

            var cuerpo = new BodyBuilder { HtmlBody = html};
            var logo = cuerpo.LinkedResources.Add("logo.png", await LeerBytesAsync("logo.png", ct), ContentType.Parse("image/png"));
            logo.ContentId = LogoContentId;

            await EnviarAsync(correoDestino, "Solicitud de recuperación de contraseña", cuerpo.ToMessageBody(), ct);
        }

        private static string Completar(string plantilla, string nombre, string enlace, string enlaceNuevo, string vencimiento)
            => plantilla
                .Replace("{{nombre}}", nombre)
                .Replace("{{enlace}}", enlace)
                .Replace("{{enlaceNuevo}}", enlaceNuevo)
                .Replace("{{vencimiento}}", vencimiento);

        private async Task EnviarAsync(string correoDestino, string asunto, MimeEntity cuerpo, CancellationToken ct)
        {
            var mensaje = new MimeMessage();
            mensaje.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
            mensaje.To.Add(MailboxAddress.Parse(correoDestino));
            mensaje.Subject = asunto;
            mensaje.Body = cuerpo;

            using var client = new SmtpClient { Timeout = 15_000 };
            await client.ConnectAsync(_options.Host, _options.Port,
                _options.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTlsWhenAvailable, ct);

            if (!string.IsNullOrEmpty(_options.User))
                await client.AuthenticateAsync(_options.User, _options.Password, ct);

            await client.SendAsync(mensaje, ct);
            await client.DisconnectAsync(true, ct);
        }


        private static async Task<string> LeerTextoAsync(string nombre, CancellationToken ct)
        {
            await using var stream = AbrirRecurso(nombre);
            using var reader = new StreamReader(stream);
            return await reader.ReadToEndAsync(ct);
        }

        private static async Task<byte[]> LeerBytesAsync(string nombre, CancellationToken ct)
        {
            await using var stream = AbrirRecurso(nombre);
            using var memoria = new MemoryStream();
            await stream.CopyToAsync(memoria, ct);
            return memoria.ToArray();
        }

        private static Stream AbrirRecurso(string nombre)
        {
            var assembly = typeof(SmtpEmailSender).Assembly;
            var recurso = assembly.GetManifestResourceNames().Single(n => n.EndsWith("." + nombre, StringComparison.Ordinal));
            return assembly.GetManifestResourceStream(recurso)!;
        }
    }
}
