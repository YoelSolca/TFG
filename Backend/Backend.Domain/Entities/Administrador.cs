namespace Backend.Domain.Entities
{
    public class Administrador
    {
        private readonly List<HistorialEstadoCuenta> _cambiosRealizados = [];

        private Administrador() { }

        public Administrador(Persona persona) => Persona = persona;

        public int PersonaId { get; private set; }
        public Persona Persona { get; private set; } = null!;
        public IReadOnlyCollection<HistorialEstadoCuenta> CambiosRealizados => _cambiosRealizados;
    }
}
