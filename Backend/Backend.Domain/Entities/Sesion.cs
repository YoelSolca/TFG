using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    // Modelo rico: el estado, la fecha y los ejercicios de la sesión solo cambian por los métodos de esta clase,
    // que son los que conocen las reglas (no se saltean pasos y los ejercicios no se tocan una vez hechos).
    public class Sesion
    {
        private readonly List<SesionEjercicio> _sesionEjercicios = [];

        private Sesion() { }

        // Una sesión nueva queda planificada, con los ejercicios en el orden en que se pidieron (el orden empieza en 1).
        public Sesion(int psicopedagogoId, int pacienteId, DateTime fecha, IEnumerable<int> ejercicioIds)
        {
            PsicopedagogoId = psicopedagogoId;
            PacienteId = pacienteId;
            Fecha = fecha;
            _sesionEjercicios.AddRange(ejercicioIds.Distinct().Select((id, i) => new SesionEjercicio(Id, id, i + 1)));
        }

        public int Id { get; private set; }
        public int PsicopedagogoId { get; private set; }
        public int PacienteId { get; private set; }
        public PsicopedagogoPaciente PsicopedagogoPaciente { get; private set; } = null!;
        public DateTime Fecha { get; private set; }
        public EstadoSesion Estado { get; private set; } = EstadoSesion.Planificada;
        public IReadOnlyCollection<SesionEjercicio> SesionEjercicios => _sesionEjercicios;

        // Los ejercicios de una sesión solo se pueden cambiar mientras está planificada y todavía no tiene resultados.
        public bool PuedeModificarse => Estado == EstadoSesion.Planificada && _sesionEjercicios.All(se => se.Resultado is null);

        // Los ejercicios que hay que borrar para que la sesión quede con la lista pedida.
        public IReadOnlyList<SesionEjercicio> EjerciciosQueSeQuitan(IReadOnlyCollection<int> ejercicioIds)
            => _sesionEjercicios.Where(se => !ejercicioIds.Contains(se.EjercicioId)).ToList();

        // La sesión queda con exactamente esos ejercicios, en ese orden: se sacan los que no están, se suman los nuevos
        // y los que se mantienen solo cambian de lugar.
        public ResultadoDominio ReemplazarEjercicios(IReadOnlyList<int> ejercicioIds)
        {
            if (!PuedeModificarse)
            {
                return ResultadoDominio.Falla("Solo se pueden modificar los ejercicios de una sesión planificada que todavía no tiene resultados.");
            }

            _sesionEjercicios.RemoveAll(se => !ejercicioIds.Contains(se.EjercicioId));
            for (var i = 0; i < ejercicioIds.Count; i++)
            {
                var existente = _sesionEjercicios.FirstOrDefault(se => se.EjercicioId == ejercicioIds[i]);
                if (existente is null) _sesionEjercicios.Add(new SesionEjercicio(Id, ejercicioIds[i], i + 1));
                else existente.CambiarOrden(i + 1);
            }

            return ResultadoDominio.Ok();
        }

        // Planificada pasa a EnCurso. La fecha de una sesión es cuándo se hizo, no cuándo se planificó.
        public ResultadoDominio Iniciar(DateTime ahora)
        {
            if (Estado != EstadoSesion.Planificada)
            {
                return ResultadoDominio.Falla($"La sesión está {Estado}: solo se puede pasar a {EstadoSesion.EnCurso} desde {EstadoSesion.Planificada}.");
            }

            Estado = EstadoSesion.EnCurso;
            Fecha = ahora;
            return ResultadoDominio.Ok();
        }

        // EnCurso pasa a Finalizada.
        public ResultadoDominio Finalizar()
        {
            if (Estado != EstadoSesion.EnCurso)
            {
                return ResultadoDominio.Falla($"La sesión está {Estado}: solo se puede pasar a {EstadoSesion.Finalizada} desde {EstadoSesion.EnCurso}.");
            }

            Estado = EstadoSesion.Finalizada;
            return ResultadoDominio.Ok();
        }
    }
}
