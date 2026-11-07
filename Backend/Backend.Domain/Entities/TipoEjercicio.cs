namespace Backend.Domain.Entities
{
    // Área que trabaja un ejercicio (atención, memoria, lectura...). Catálogo cargado por las migraciones.
    public class TipoEjercicio
    {
        private readonly List<Ejercicio> _ejercicios = [];

        private TipoEjercicio() { }

        public TipoEjercicio(string nombre, string icono)
        {
            if (string.IsNullOrWhiteSpace(nombre))
                throw new ArgumentException("El tipo de ejercicio necesita un nombre.", nameof(nombre));

            Nombre = nombre;
            this.icono = icono;
        }

        public int Id { get; private set; }
        public string Nombre { get; private set; } = string.Empty;
        public string icono { get; private set; } = string.Empty;
        public IReadOnlyCollection<Ejercicio> Ejercicios => _ejercicios;
    }
}
