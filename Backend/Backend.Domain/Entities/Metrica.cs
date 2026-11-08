namespace Backend.Domain.Entities
{
    // Dato extra que registra un ejercicio (movimientos, pistas...). Catálogo cargado por las migraciones.
    public class Metrica
    {
        private readonly List<ResultadoMetrica> _resultadoMetricas = [];

        private Metrica() { }

        public Metrica(string nombre, TipoAgregacion tipoAgregacion, string? descripcion = null, string? unidad = null)
        {
            if (string.IsNullOrWhiteSpace(nombre))
                throw new ArgumentException("La métrica necesita un nombre.", nameof(nombre));

            Nombre = nombre;
            TipoAgregacion = tipoAgregacion;
            Descripcion = descripcion;
            Unidad = unidad;
        }

        public int Id { get; private set; }
        public string Nombre { get; private set; } = string.Empty;
        public string? Descripcion { get; private set; }
        public string? Unidad { get; private set; }
        public TipoAgregacion TipoAgregacion { get; private set; }
        public IReadOnlyCollection<ResultadoMetrica> ResultadoMetricas => _resultadoMetricas;
    }
}
