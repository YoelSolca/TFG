namespace Backend.Domain.Entities
{
    public class Paciente
    {
        private readonly List<PsicopedagogoPaciente> _psicopedagogoPacientes = [];

        private Paciente() { }

        public Paciente(Persona persona, DateTime fechaAlta)
        {
            Persona = persona;
            FechaAlta = fechaAlta;
        }

        public int PersonaId { get; private set; }
        public Persona Persona { get; private set; } = null!;
        public DateTime FechaAlta { get; private set; }
        public IReadOnlyCollection<PsicopedagogoPaciente> PsicopedagogoPacientes => _psicopedagogoPacientes;

        // Un profesional empieza a atender al paciente con su propia intervención.
        public PsicopedagogoPaciente IniciarAtencion(int psicopedagogoId, Intervencion intervencion, DateTime ahora)
        {
            var atencion = new PsicopedagogoPaciente(PersonaId, psicopedagogoId, intervencion, ahora);
            _psicopedagogoPacientes.Add(atencion);
            return atencion;
        }

        public PsicopedagogoPaciente? AtencionDe(int psicopedagogoId)
            => _psicopedagogoPacientes.FirstOrDefault(a => a.PsicopedagogoId == psicopedagogoId);
    }
}
