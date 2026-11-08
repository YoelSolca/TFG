using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    // Modelo rico: el estado de la cuenta, la contraseña y el historial solo cambian por los métodos de esta clase,
    // que son los que conocen las reglas. Desde afuera se pueden leer, pero no asignar.
    public class Usuario
    {
        public int PersonaId { get; private set; }
        public Persona Persona { get; private set; } = null!;
        public string CorreoElectronico { get; private set; } = string.Empty;
        public string Contrasenia { get; private set; } = string.Empty;
        public DateTime FechaAlta { get; private set; }
        public string? TokenRestablecimiento { get; private set; }
        public DateTime FechaExpiracionTokenRestablecimiento { get; private set; }
        public DateTime FechaRecuperacion { get; private set; }
        public string? SecretoDobleFactor { get; private set; }
        public bool DobleFactorHabilitado { get; private set; }
        public RolUsuario Rol { get; private set; }
        public EstadoCuenta Estado { get; private set; } = EstadoCuenta.Pendiente;
        public DateTime FechaSolicitud { get; private set; }
        public bool AceptoTerminos { get; private set; }
        public DateTime? FechaAceptacionTerminos { get; private set; }

        // El historial solo se agrega a través de CambiarEstado: hacia afuera es de solo lectura.
        private readonly List<HistorialEstadoCuenta> _historial = new();
        public IReadOnlyCollection<HistorialEstadoCuenta> Historial => _historial;

        // Para Entity Framework, que crea la entidad vacía y después carga sus datos.
        private Usuario() { }

        public Usuario(string correoElectronico, string contraseniaHash, RolUsuario rol, DateTime ahora,
            bool aceptoTerminos, EstadoCuenta estado = EstadoCuenta.Pendiente)
        {
            CorreoElectronico = correoElectronico;
            Contrasenia = contraseniaHash;
            Rol = rol;
            Estado = estado;
            FechaAlta = ahora;
            FechaSolicitud = ahora;
            AceptoTerminos = aceptoTerminos;
            FechaAceptacionTerminos = ahora;
        }

        // Cambia el estado de la cuenta respetando las reglas y deja el registro en el historial.
        // El motivo es opcional (el panel de administración permite no indicarlo).
        public ResultadoDominio CambiarEstado(EstadoCuenta nuevo, int administradorId, string? motivo, DateTime ahora)
        {
            if (nuevo == Estado)
            {
                return ResultadoDominio.Falla($"La cuenta ya está {Estado}.");
            }

            if (!TransicionPermitida(Estado, nuevo))
            {
                return ResultadoDominio.Falla($"No se puede pasar una cuenta de {Estado} a {nuevo}.");
            }

            _historial.Add(new HistorialEstadoCuenta(administradorId, Estado, nuevo, motivo, ahora));
            Estado = nuevo;
            return ResultadoDominio.Ok();
        }

        // Pendiente se aprueba o se rechaza; una aprobada se suspende o vuelve a pendiente;
        // una rechazada o suspendida se puede aprobar de nuevo.
        private static bool TransicionPermitida(EstadoCuenta desde, EstadoCuenta hasta) => (desde, hasta) switch
        {
            (EstadoCuenta.Pendiente, EstadoCuenta.Aprobado) => true,
            (EstadoCuenta.Pendiente, EstadoCuenta.Rechazado) => true,
            (EstadoCuenta.Aprobado, EstadoCuenta.Suspendido) => true,
            (EstadoCuenta.Aprobado, EstadoCuenta.Pendiente) => true,
            (EstadoCuenta.Rechazado, EstadoCuenta.Aprobado) => true,
            (EstadoCuenta.Suspendido, EstadoCuenta.Aprobado) => true,
            _ => false
        };

        // El correo es con lo que se entra a la cuenta: no puede quedar vacío.
        public ResultadoDominio CambiarCorreo(string correoElectronico)
        {
            if (string.IsNullOrWhiteSpace(correoElectronico))
            {
                return ResultadoDominio.Falla("El correo electrónico es obligatorio.");
            }

            CorreoElectronico = correoElectronico.Trim().ToLowerInvariant();
            return ResultadoDominio.Ok();
        }

        // Cambio de contraseña hecho por el propio usuario: si había un enlace de recuperación pendiente, deja de servir.
        public void CambiarContrasenia(string contraseniaHash)
        {
            Contrasenia = contraseniaHash;
            TokenRestablecimiento = null;
            FechaExpiracionTokenRestablecimiento = DateTime.MinValue;
        }

        // Contraseña nueva elegida a través del enlace de recuperación: además se registra cuándo ocurrió.
        public void RestablecerContrasenia(string contraseniaHash, DateTime ahora)
        {
            CambiarContrasenia(contraseniaHash);
            FechaRecuperacion = ahora;
        }

        public void GuardarTokenDeRestablecimiento(string tokenHash, DateTime expiracion)
        {
            TokenRestablecimiento = tokenHash;
            FechaExpiracionTokenRestablecimiento = expiracion;
        }
    }
}
