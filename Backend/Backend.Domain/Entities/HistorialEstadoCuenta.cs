namespace Backend.Domain.Entities
{
    // Un cambio de estado de una cuenta, con quién lo hizo y por qué. Solo lo crea Usuario.CambiarEstado.
    public class HistorialEstadoCuenta
    {
        private HistorialEstadoCuenta() { }

        internal HistorialEstadoCuenta(int administradorId, EstadoCuenta estadoAnterior, EstadoCuenta estadoNuevo, string? motivo, DateTime fecha)
        {
            AdministradorId = administradorId;
            EstadoAnterior = estadoAnterior;
            EstadoNuevo = estadoNuevo;
            Motivo = motivo;
            Fecha = fecha;
        }

        public int Id { get; private set; }
        public int UsuarioId { get; private set; }
        public Usuario Usuario { get; private set; } = null!;
        public int AdministradorId { get; private set; }
        public Administrador Administrador { get; private set; } = null!;
        public EstadoCuenta EstadoAnterior { get; private set; }
        public EstadoCuenta EstadoNuevo { get; private set; }
        public string? Motivo { get; private set; }
        public DateTime Fecha { get; private set; }
    }
}
