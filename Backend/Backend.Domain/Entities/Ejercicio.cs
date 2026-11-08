namespace Backend.Domain.Entities
{
    // Un ejercicio del catálogo. Lo cargan las migraciones: la aplicación solo lo consulta.
    public class Ejercicio
    {
        private readonly List<SesionEjercicio> _sesionEjercicios = [];

        private Ejercicio() { }

        public Ejercicio(string nombre, int tipoEjercicioId, string? descripcion = null)
        {
            if (string.IsNullOrWhiteSpace(nombre))
                throw new ArgumentException("El ejercicio necesita un nombre.", nameof(nombre));

            Nombre = nombre;
            TipoEjercicioId = tipoEjercicioId;
            Descripcion = descripcion;
        }

        public int Id { get; private set; }
        public string Nombre { get; private set; } = string.Empty;
        public string? Descripcion { get; private set; }
        public int TipoEjercicioId { get; private set; }
        public TipoEjercicio TipoEjercicio { get; private set; } = null!;
        public IReadOnlyCollection<SesionEjercicio> SesionEjercicios => _sesionEjercicios;
    }
}
