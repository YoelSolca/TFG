namespace Backend.Domain.Common
{
    // Resultado de una operación de una entidad (por ejemplo, cambiar el estado de una cuenta).
    // Vive en Domain porque las entidades no pueden depender de Application, donde está Result<T>.
    public sealed class ResultadoDominio
    {
        public bool EsExitoso { get; }
        public string? Error { get; }

        private ResultadoDominio(bool esExitoso, string? error)
        {
            EsExitoso = esExitoso;
            Error = error;
        }

        public static ResultadoDominio Ok() => new(true, null);
        public static ResultadoDominio Falla(string error) => new(false, error);
    }
}
