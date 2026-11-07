using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    public class Intervencion
    {
        public const int MaxObjetivo = 500;
        public const int MaxObservaciones = 1000;

        private readonly List<IntervencionTipoDificultad> _tiposDificultad = [];

        private Intervencion() { }

        // Una intervención siempre trabaja al menos una dificultad: los datos ya vienen validados por el servicio.
        public Intervencion(string? objetivo, string? observaciones, IEnumerable<int> tiposDificultadIds)
        {
            var ids = tiposDificultadIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                throw new ArgumentException("Una intervención necesita al menos un tipo de dificultad.", nameof(tiposDificultadIds));
            }

            this.objetivo = objetivo;
            this.observaciones = observaciones;
            _tiposDificultad.AddRange(ids.Select(id => new IntervencionTipoDificultad(id)));
        }

        public int Id { get; private set; }
        public string? objetivo { get; private set; }
        public string? observaciones { get; private set; }
        public IReadOnlyCollection<IntervencionTipoDificultad> TiposDificultad => _tiposDificultad;
        public PsicopedagogoPaciente? PsicopedagogoPaciente { get; private set; }

        public ResultadoDominio Actualizar(string? objetivo, string? observaciones)
        {
            if (objetivo?.Length > MaxObjetivo)
            {
                return ResultadoDominio.Falla($"El objetivo no puede superar los {MaxObjetivo} caracteres.");
            }

            if (observaciones?.Length > MaxObservaciones)
            {
                return ResultadoDominio.Falla($"Las observaciones no pueden superar los {MaxObservaciones} caracteres.");
            }

            this.objetivo = objetivo;
            this.observaciones = observaciones;
            return ResultadoDominio.Ok();
        }

        // Las dificultades quedan exactamente las pedidas: se sacan las que ya no están y se suman las nuevas.
        public ResultadoDominio DefinirDificultades(IEnumerable<int> tiposDificultadIds)
        {
            var ids = tiposDificultadIds.Distinct().ToList();
            if (ids.Count == 0)
            {
                return ResultadoDominio.Falla("La intervención necesita al menos un tipo de dificultad.");
            }

            _tiposDificultad.RemoveAll(t => !ids.Contains(t.TipoDificultadId));
            foreach (var id in ids.Where(id => _tiposDificultad.All(t => t.TipoDificultadId != id)))
            {
                _tiposDificultad.Add(new IntervencionTipoDificultad(id));
            }

            return ResultadoDominio.Ok();
        }
    }
}
