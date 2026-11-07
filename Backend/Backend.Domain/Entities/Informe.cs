namespace Backend.Domain.Entities
{
    // Un informe ya generado: no se modifica, por eso sus datos solo se fijan al crearlo.
    public class Informe
    {
        public const int MaxResumen = 500;

        private Informe() { }

        // El servicio valida el período antes; acá se protege que no exista un informe con datos imposibles.
        public Informe(int pacienteId, int psicopedagogoId, DateTime periodoDesde, DateTime periodoHasta,
            string resumen, string contenido, DateTime ahora)
        {
            if (periodoDesde > periodoHasta)
                throw new ArgumentException("El período del informe no puede empezar después de terminar.");
            if (string.IsNullOrWhiteSpace(contenido))
                throw new ArgumentException("El informe necesita contenido.", nameof(contenido));
            if (string.IsNullOrWhiteSpace(resumen) || resumen.Length > MaxResumen)
                throw new ArgumentException($"El resumen es obligatorio y admite hasta {MaxResumen} caracteres.", nameof(resumen));

            PacienteId = pacienteId;
            PsicopedagogoId = psicopedagogoId;
            PeriodoDesde = periodoDesde;
            PeriodoHasta = periodoHasta;
            Resumen = resumen;
            Contenido = contenido;
            FechaGeneracion = ahora;
        }

        public int Id { get; private set; }
        public int PacienteId { get; private set; }
        public Paciente Paciente { get; private set; } = null!;
        public int PsicopedagogoId { get; private set; }
        public Psicopedagogo Psicopedagogo { get; private set; } = null!;
        public DateTime FechaGeneracion { get; private set; }
        public DateTime PeriodoDesde { get; private set; }
        public DateTime PeriodoHasta { get; private set; }
        public string Resumen { get; private set; } = string.Empty;
        public string Contenido { get; private set; } = string.Empty;

        // Los informes de ejemplo se completan con el texto de muestra (solo lo usa el sembrado de desarrollo).
        public void ReemplazarTextos(string resumen, string contenido)
        {
            Resumen = resumen;
            Contenido = contenido;
        }
    }
}
