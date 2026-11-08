using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    // Lo que se registró al hacer un ejercicio de una sesión: aciertos, errores, tiempo y las métricas propias del ejercicio.
    public class Resultado
    {
        public const int MaxObservaciones = 500;

        private readonly List<ResultadoMetrica> _resultadoMetricas = [];

        private Resultado() { }

        // Los datos tienen que haberse validado antes con Validar; si no, el constructor los rechaza.
        public Resultado(int sesionId, int ejercicioId, int aciertos, int errores, int? tiempoSegundos, string? observaciones,
            DateTime ahora, IEnumerable<(int MetricaId, decimal Valor)> metricas)
        {
            var validacion = Validar(aciertos, errores, tiempoSegundos, observaciones);
            if (!validacion.EsExitoso)
            {
                throw new ArgumentException(validacion.Error);
            }

            SesionId = sesionId;
            EjercicioId = ejercicioId;
            Aciertos = aciertos;
            Errores = errores;
            TiempoSegundos = tiempoSegundos;
            Observaciones = observaciones;
            FechaRegistro = ahora;
            DefinirMetricas(metricas);
        }

        public int SesionId { get; private set; }
        public int EjercicioId { get; private set; }
        public SesionEjercicio SesionEjercicio { get; private set; } = null!;
        public int Aciertos { get; private set; }
        public int Errores { get; private set; }
        public int? TiempoSegundos { get; private set; }
        public string? Observaciones { get; private set; }
        public DateTime FechaRegistro { get; private set; }
        public IReadOnlyCollection<ResultadoMetrica> ResultadoMetricas => _resultadoMetricas;

        public static ResultadoDominio Validar(int aciertos, int errores, int? tiempoSegundos, string? observaciones)
        {
            if (aciertos < 0 || errores < 0 || tiempoSegundos < 0)
            {
                return ResultadoDominio.Falla("Los aciertos, los errores y el tiempo no pueden ser negativos.");
            }

            if (observaciones?.Length > MaxObservaciones)
            {
                return ResultadoDominio.Falla($"Las observaciones no pueden superar los {MaxObservaciones} caracteres.");
            }

            return ResultadoDominio.Ok();
        }

        // Volver a cargar el resultado de un ejercicio reemplaza el anterior: cambian los datos y las métricas.
        public ResultadoDominio Actualizar(int aciertos, int errores, int? tiempoSegundos, string? observaciones,
            DateTime ahora, IEnumerable<(int MetricaId, decimal Valor)> metricas)
        {
            var validacion = Validar(aciertos, errores, tiempoSegundos, observaciones);
            if (!validacion.EsExitoso)
            {
                return validacion;
            }

            Aciertos = aciertos;
            Errores = errores;
            TiempoSegundos = tiempoSegundos;
            Observaciones = observaciones;
            FechaRegistro = ahora;
            DefinirMetricas(metricas);
            return ResultadoDominio.Ok();
        }

        // Las métricas quedan exactamente las pedidas (si una se repite vale la última). Se reutilizan las filas que ya
        // existen en vez de borrar y volver a crear, para no chocar con la clave (sesión, ejercicio, métrica).
        private void DefinirMetricas(IEnumerable<(int MetricaId, decimal Valor)> metricas)
        {
            var pedidas = metricas.GroupBy(m => m.MetricaId).ToDictionary(g => g.Key, g => g.Last().Valor);

            _resultadoMetricas.RemoveAll(m => !pedidas.ContainsKey(m.MetricaId));
            foreach (var (metricaId, valor) in pedidas)
            {
                var existente = _resultadoMetricas.FirstOrDefault(m => m.MetricaId == metricaId);
                if (existente is null) _resultadoMetricas.Add(new ResultadoMetrica(SesionId, EjercicioId, metricaId, valor));
                else existente.CambiarValor(valor);
            }
        }
    }
}
