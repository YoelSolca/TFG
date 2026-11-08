namespace Backend.Domain.Entities
{
    public class ResultadoMetrica
    {
        private ResultadoMetrica() { }

        // Se crea desde el resultado, que es quien decide qué métricas tiene.
        internal ResultadoMetrica(int sesionId, int ejercicioId, int metricaId, decimal valor)
        {
            SesionId = sesionId;
            EjercicioId = ejercicioId;
            MetricaId = metricaId;
            Valor = valor;
        }

        public int SesionId { get; private set; }
        public int EjercicioId { get; private set; }
        public Resultado Resultado { get; private set; } = null!;
        public int MetricaId { get; private set; }
        public Metrica Metrica { get; private set; } = null!;
        public decimal Valor { get; private set; }

        internal void CambiarValor(decimal valor) => Valor = valor;
    }
}
