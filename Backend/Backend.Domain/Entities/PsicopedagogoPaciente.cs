using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    // La atención de un profesional a un paciente: cuándo empezó, si sigue activa y su intervención.
    public class PsicopedagogoPaciente
    {
        private readonly List<Sesion> _sesiones = [];

        private PsicopedagogoPaciente() { }

        public PsicopedagogoPaciente(int pacienteId, int psicopedagogoId, Intervencion intervencion, DateTime ahora)
        {
            PacienteId = pacienteId;
            PsicopedagogoId = psicopedagogoId;
            Intervencion = intervencion;
            FechaInicio = ahora;
        }

        // Para un paciente que todavía no tiene id: Entity Framework arma la relación por el objeto.
        internal PsicopedagogoPaciente(Paciente paciente, Intervencion intervencion, DateTime ahora)
        {
            Paciente = paciente;
            Intervencion = intervencion;
            FechaInicio = ahora;
        }

        public int PacienteId { get; private set; }
        public Paciente Paciente { get; private set; } = null!;
        public int PsicopedagogoId { get; private set; }
        public Psicopedagogo Psicopedagogo { get; private set; } = null!;
        public DateTime FechaInicio { get; private set; }
        public DateTime? FechaFin { get; private set; }
        public int IntervencionId { get; private set; }
        public Intervencion Intervencion { get; private set; } = null!;
        public IReadOnlyCollection<Sesion> Sesiones => _sesiones;

        public bool EstaActiva => FechaFin is null;

        public ResultadoDominio Finalizar(DateTime ahora)
        {
            if (!EstaActiva)
            {
                return ResultadoDominio.Falla("La atención ya estaba finalizada.");
            }

            FechaFin = ahora;
            return ResultadoDominio.Ok();
        }

        // Si la atención había terminado se reabre con el mismo historial.
        public ResultadoDominio Reactivar()
        {
            if (EstaActiva)
            {
                return ResultadoDominio.Falla("La atención ya está activa.");
            }

            FechaFin = null;
            return ResultadoDominio.Ok();
        }

        public void AgregarSesion(Sesion sesion) => _sesiones.Add(sesion);
    }
}
