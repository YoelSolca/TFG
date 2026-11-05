namespace Backend.Api.Security
{
    // Nombres de las políticas de acceso; se definen en Program.cs y se usan en los controladores con [Authorize(Policy = ...)].
    public static class Politicas
    {
        public const string Administrador = "Administrador";
    }
}
