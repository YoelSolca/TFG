namespace Backend.Application.Options
{
    public class EmailOptions
    {
        public const string SectionName = "Email";

        // Servidor SMTP. La clave va en user-secrets o en una variable de entorno (Email__Password), nunca en el repo.
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 465;
        // true: conexión cifrada desde el inicio (puerto 465). false: STARTTLS si el servidor lo ofrece (587, o 1025 en un SMTP de prueba).
        public bool UseSsl { get; set; } = true;
        public string User { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        public string FromAddress { get; set; } = string.Empty;
        public string FromName { get; set; } = "Soporte";

        // Dirección del front, para armar los enlaces de los correos.
        public string FrontendBaseUrl { get; set; } = string.Empty;
    }
}
