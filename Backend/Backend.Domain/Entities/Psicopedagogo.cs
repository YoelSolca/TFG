using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    public class Psicopedagogo
    {
        private readonly List<PsicopedagogoPaciente> _psicopedagogoPacientes = [];

        private Psicopedagogo() { }

        public Psicopedagogo(Persona persona, string telefono, string direccion, string matricula, string? avatar = null)
        {
            Persona = persona;
            Telefono = telefono;
            Direccion = direccion;
            Matricula = matricula;
            Avatar = avatar;
        }

        public int PersonaId { get; private set; }
        public Persona Persona { get; private set; } = null!;
        public string? Avatar { get; private set; }
        public string Telefono { get; private set; } = string.Empty;
        public string Direccion { get; private set; } = string.Empty;
        public string Matricula { get; private set; } = string.Empty;
        public IReadOnlyCollection<PsicopedagogoPaciente> PsicopedagogoPacientes => _psicopedagogoPacientes;

        // El teléfono se guarda solo con dígitos y tiene entre 8 y 13; la dirección es obligatoria.
        public ResultadoDominio ActualizarContacto(string telefono, string direccion)
        {
            var digitos = new string((telefono ?? string.Empty).Where(char.IsDigit).ToArray());
            if (digitos.Length is < 8 or > 13)
            {
                return ResultadoDominio.Falla("Teléfono inválido.");
            }

            if (string.IsNullOrWhiteSpace(direccion))
            {
                return ResultadoDominio.Falla("La dirección es obligatoria.");
            }

            Telefono = digitos;
            Direccion = direccion.Trim();
            return ResultadoDominio.Ok();
        }

        // Empieza a atender a un paciente que todavía no está guardado (lo usan los datos de ejemplo).
        public PsicopedagogoPaciente IniciarAtencion(Paciente paciente, Intervencion intervencion, DateTime ahora)
        {
            var atencion = new PsicopedagogoPaciente(paciente, intervencion, ahora);
            _psicopedagogoPacientes.Add(atencion);
            return atencion;
        }
    }
}
