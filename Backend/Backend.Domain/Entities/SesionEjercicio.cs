using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    // Un ejercicio dentro de una sesión: en qué lugar se hace y, cuando se hizo, su resultado.
    public class SesionEjercicio
    {
        private SesionEjercicio() { }

        // Lo crea la sesión, que decide el orden.
        internal SesionEjercicio(int sesionId, int ejercicioId, int orden)
        {
            SesionId = sesionId;
            EjercicioId = ejercicioId;
            Orden = orden;
        }

        public int SesionId { get; private set; }
        public Sesion Sesion { get; private set; } = null!;
        public int EjercicioId { get; private set; }
        public Ejercicio Ejercicio { get; private set; } = null!;
        public int Orden { get; private set; }
        public Resultado? Resultado { get; private set; }

        internal void CambiarOrden(int orden) => Orden = orden;

        // Registra lo que pasó al hacer el ejercicio; si ya tenía resultado, lo reemplaza.
        public ResultadoDominio RegistrarResultado(int aciertos, int errores, int? tiempoSegundos, string? observaciones,
            DateTime ahora, IEnumerable<(int MetricaId, decimal Valor)> metricas)
        {
            if (Resultado is not null)
            {
                return Resultado.Actualizar(aciertos, errores, tiempoSegundos, observaciones, ahora, metricas);
            }

            var validacion = Resultado.Validar(aciertos, errores, tiempoSegundos, observaciones);
            if (!validacion.EsExitoso)
            {
                return validacion;
            }

            Resultado = new Resultado(SesionId, EjercicioId, aciertos, errores, tiempoSegundos, observaciones, ahora, metricas);
            return ResultadoDominio.Ok();
        }
    }
}
