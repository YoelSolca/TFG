namespace Backend.Domain.Entities
{
    // Tipo de dificultad que se trabaja con un paciente. Catálogo cargado por las migraciones.
    public class TipoDificultad
    {
        private readonly List<IntervencionTipoDificultad> _intervencionTiposDificultad = [];

        private TipoDificultad() { }

        public TipoDificultad(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre))
                throw new ArgumentException("El tipo de dificultad necesita un nombre.", nameof(nombre));

            Nombre = nombre;
        }

        public int Id { get; private set; }
        public string Nombre { get; private set; } = string.Empty;
        public IReadOnlyCollection<IntervencionTipoDificultad> IntervencionTiposDificultad => _intervencionTiposDificultad;
    }
}
