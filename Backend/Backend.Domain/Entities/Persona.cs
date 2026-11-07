using Backend.Domain.Common;

namespace Backend.Domain.Entities
{
    public class Persona
    {
        // Entity Framework usa este constructor para armar la entidad al leerla de la base.
        private Persona() { }

        public Persona(string nombre, string apellido, string documento, string? genero, DateOnly? fechaNacimiento)
        {
            Nombre = nombre;
            Apellido = apellido;
            Documento = documento;
            Genero = genero;
            FechaNacimiento = fechaNacimiento;
        }

        public int Id { get; private set; }
        public string Nombre { get; private set; } = string.Empty;
        public string Apellido { get; private set; } = string.Empty;
        public string Documento { get; private set; } = string.Empty;
        public string? Genero { get; private set; }
        public DateOnly? FechaNacimiento { get; private set; }
        public Psicopedagogo Psicopedagogo { get; private set; } = null!;
        public Paciente Paciente { get; private set; } = null!;
        public Administrador Administrador { get; private set; } = null!;
        public Usuario Usuario { get; private set; } = null!;

        public void AsignarUsuario(Usuario usuario) => Usuario = usuario;

        // Cambia los datos personales solo si son válidos: si hay algún problema no se modifica nada.
        public ResultadoDominio ActualizarDatos(string nombre, string apellido, string documento, string? genero, DateOnly? fechaNacimiento, DateOnly hoy)
        {
            if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(apellido) || string.IsNullOrWhiteSpace(documento))
            {
                return ResultadoDominio.Falla("Nombre, apellido y documento son obligatorios.");
            }

            if (fechaNacimiento is null || fechaNacimiento > hoy)
            {
                return ResultadoDominio.Falla("La fecha de nacimiento es obligatoria y no puede ser futura.");
            }

            Nombre = nombre.Trim();
            Apellido = apellido.Trim();
            Documento = documento.Trim();
            Genero = genero;
            FechaNacimiento = fechaNacimiento;
            return ResultadoDominio.Ok();
        }
    }
}
