using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Infrastructure.Data
{
    /// <summary>
    /// Datos de prueba solo para desarrollo: 1 administrador y 1 psicopedagogo con 3 pacientes, sesiones, resultados e informe.
    /// Es idempotente: si el administrador o el psicopedagogo ya existen, no los vuelve a crear. Los catálogos los siembran las migraciones.
    /// </summary>
    public class DevelopmentDataSeeder(AppDbContext context, IPasswordHasher hasher, ILogger<DevelopmentDataSeeder> logger)
    {
        private const string DocumentoPsicopedagogo = "30111222";
        private const string DocumentoAdministrador = "28999000";
        private const string Obs = "Se observa buena concentración en la primera parte. En la segunda aumentan los errores por distracción. Se recomienda continuar con actividades visuales.";

        // Ids del catálogo sembrado por las migraciones.
        private const int ImagenIgual = 1, Memorama = 4, ConectarPalabras = 5, ComprensionTexto = 6,
                          Dictado = 7, SumasRestas = 8, SeriesNumericas = 9, DesafioNumeros = 10;
        private const int DifAtencion = 1, DifLectoescritura = 2, DifCalculo = 3, DifMemoria = 4;
        private const int Movimientos = 1;

        public async Task SeedAsync(CancellationToken ct = default)
        {
            await SeedAdministradorAsync(ct);
            await SeedPsicopedagogoAsync(ct);
            await SeedInformesAsync(ct);
            await SeedSesionesFinalizadasAsync(ct);
        }

        private Task<int?> PsicopedagogoDemoIdAsync(CancellationToken ct)
            => context.Psicopedagogo
                .Where(p => p.Persona.Documento == DocumentoPsicopedagogo)
                .Select(p => (int?)p.PersonaId)
                .FirstOrDefaultAsync(ct);

        // Todavía no hay una pantalla que finalice las sesiones: las de prueba, que ya tienen todos sus resultados, se marcan como finalizadas.
        private async Task SeedSesionesFinalizadasAsync(CancellationToken ct)
        {
            var psicopedagogoId = await PsicopedagogoDemoIdAsync(ct);
            if (psicopedagogoId is null) return;

            var sesiones = await context.Sesion
                .Where(s => s.PsicopedagogoId == psicopedagogoId
                         && s.Estado == EstadoSesion.Planificada
                         && s.SesionEjercicios.Any()
                         && s.SesionEjercicios.All(se => se.Resultado != null))
                .ToListAsync(ct);
            if (sesiones.Count == 0) return;

            foreach (var sesion in sesiones) sesion.Estado = EstadoSesion.Finalizada;

            await context.SaveChangesAsync(ct);
            logger.LogInformation("Sesiones de desarrollo marcadas como finalizadas: {Cantidad}.", sesiones.Count);
        }

        private const string ResumenInformeInicial = "Mejoras sostenidas en atención y memoria durante el período.";

        // Resumen (una frase, va en el listado) -> contenido (informe completo, va en el detalle).
        // {0} es el nombre del paciente.
        private static readonly Dictionary<string, string> ContenidoPorResumen = new()
        {
            [ResumenInformeInicial] =
                "Durante el último mes, {0} mantuvo una asistencia regular y una buena disposición al trabajo. En los ejercicios de atención el porcentaje de aciertos subió de forma gradual, y en los de memoria logró resolver niveles que al comienzo le resultaban difíciles. Se observa que se distrae menos ante estímulos auditivos cuando la consigna es breve y se da una sola vez. Se sugiere sostener la frecuencia semanal y sumar ejercicios de memoria de trabajo con dificultad creciente.",
            ["Mejora sostenida en atención y lectura; se observa posible estancamiento en cálculo."] =
                "Durante el período analizado, {0} mostró una mejora sostenida en las actividades de atención y lectura, con un incremento progresivo en el porcentaje de aciertos sesión a sesión. Sin embargo, se identificó un posible estancamiento en los ejercicios de cálculo: los resultados de las últimas tres sesiones no muestran variación significativa respecto al período anterior, e incluso se observa un leve aumento en el tiempo de resolución. Se sugiere reforzar este eje con actividades de menor complejidad antes de continuar avanzando en el plan actual.",
            ["Baja participación y menor cantidad de aciertos en las últimas dos sesiones registradas."] =
                "En las últimas dos sesiones {0} completó menos ejercicios de los previstos y disminuyó la cantidad de aciertos respecto de las sesiones anteriores. Los errores se concentran en la escritura de palabras largas y en las consignas que requieren leer en voz alta. Se registró además cansancio hacia el final de cada sesión. Se recomienda acortar la duración de las sesiones, alternar actividades de lectura con otras más lúdicas y evaluar con la familia posibles factores que estén afectando su motivación.",
            ["Progreso constante en escritura, sin variaciones significativas respecto al período anterior."] =
                "{0} continuó trabajando de manera constante en los ejercicios de escritura, con un desempeño estable a lo largo del período. No se observan retrocesos, pero tampoco cambios importantes en la cantidad de errores ortográficos ni en el tiempo que necesita para completar cada actividad. Responde muy bien al refuerzo positivo y se muestra más tranquilo cuando puede anticipar la tarea. Se sugiere introducir textos un poco más extensos y actividades de dictado con vocabulario nuevo para estimular un nuevo avance.",
            ["Buen desempeño general en memoria; se sugiere reforzar ejercicios de cálculo."] =
                "En este período {0} tuvo un buen desempeño en las actividades de memoria: recordó secuencias más largas y cometió menos errores en cada intento. En cambio, en cálculo mental se frustra con facilidad ante los errores y suele abandonar la actividad antes de terminarla. Los resultados mejoran cuando las operaciones se presentan de forma gradual y con apoyo visual. Se recomienda reforzar el cálculo con ejercicios de baja complejidad, celebrar los logros parciales y mantener las actividades de memoria como punto de apoyo.",
            ["Progreso estable en las áreas trabajadas, sin variaciones significativas respecto al período anterior."] =
                "Durante el período {0} sostuvo un rendimiento estable en todas las áreas trabajadas. Los porcentajes de aciertos se mantienen en valores similares a los del informe anterior, con una leve mejora en los tiempos de respuesta en los ejercicios de atención. Se observa mayor autonomía para iniciar las actividades sin necesidad de apoyo constante. Al ser un período sin grandes cambios, se sugiere revisar los objetivos del plan y evaluar si corresponde aumentar la dificultad de los ejercicios.",
            ["Primeros avances en comprensión lectora; cuesta la escritura de palabras largas."] =
                "En este primer período de trabajo {0} comenzó a mostrar avances en la comprensión lectora: logra responder preguntas simples sobre textos cortos y se anima a leer con menos apoyo. La escritura sigue siendo un punto de dificultad, sobre todo con palabras largas, donde omite o invierte sílabas. Se recomienda continuar con lecturas breves y frecuentes, trabajar la escritura por sílabas y proponer dictados cortos, siempre en un clima de confianza que le permita equivocarse sin presión."
        };

        // Aparte del psicopedagogo para que también complete bases ya sembradas.
        private async Task SeedInformesAsync(CancellationToken ct)
        {
            var psicopedagogoId = await PsicopedagogoDemoIdAsync(ct);
            if (psicopedagogoId is null) return;

            // Los informes sembrados antes no tenían resumen y tenían un contenido de relleno: se completan
            // con el contenido de ejemplo, usando el nombre que tenga hoy el paciente.
            var existentes = await context.Informe
                .Include(i => i.Paciente).ThenInclude(p => p.Persona)
                .Where(i => i.PsicopedagogoId == psicopedagogoId)
                .ToListAsync(ct);
            foreach (var informe in existentes)
            {
                if (informe.Resumen == "") informe.Resumen = ResumenInformeInicial;
                if (ContenidoPorResumen.TryGetValue(informe.Resumen, out var plantilla))
                    informe.Contenido = string.Format(plantilla, informe.Paciente.Persona.Nombre);
            }
            await context.SaveChangesAsync(ct);

            // Los informes de ejemplo se agregan una sola vez.
            if (existentes.Any(i => i.Resumen != ResumenInformeInicial)) return;

            var pacientes = await context.Paciente
                .Where(p => p.Persona.Documento == "56058870" || p.Persona.Documento == "65221087" || p.Persona.Documento == "54576522")
                .Select(p => new { p.Persona.Documento, p.PersonaId, p.Persona.Nombre })
                .ToDictionaryAsync(p => p.Documento, ct);

            var ahora = DateTime.Now;
            (string Documento, int DiasAtras, int PeriodoDesdeDias, int PeriodoHastaDias, string Resumen)[] ejemplos =
            [
                ("56058870", 2, 60, 30, "Mejora sostenida en atención y lectura; se observa posible estancamiento en cálculo."),
                ("65221087", 5, 45, 15, "Baja participación y menor cantidad de aciertos en las últimas dos sesiones registradas."),
                ("54576522", 9, 90, 30, "Progreso constante en escritura, sin variaciones significativas respecto al período anterior."),
                ("54576522", 40, 120, 90, "Buen desempeño general en memoria; se sugiere reforzar ejercicios de cálculo."),
                ("56058870", 70, 150, 90, "Progreso estable en las áreas trabajadas, sin variaciones significativas respecto al período anterior."),
                ("65221087", 95, 180, 120, "Primeros avances en comprensión lectora; cuesta la escritura de palabras largas.")
            ];

            foreach (var (documento, diasAtras, desde, hasta, resumen) in ejemplos)
            {
                if (!pacientes.TryGetValue(documento, out var paciente)) continue;

                context.Informe.Add(new Informe
                {
                    PacienteId = paciente.PersonaId,
                    PsicopedagogoId = psicopedagogoId.Value,
                    FechaGeneracion = ahora.AddDays(-diasAtras),
                    PeriodoDesde = ahora.AddDays(-desde),
                    PeriodoHasta = ahora.AddDays(-hasta),
                    Resumen = resumen,
                    Contenido = string.Format(ContenidoPorResumen[resumen], paciente.Nombre)
                });
            }

            await context.SaveChangesAsync(ct);
            logger.LogInformation("Informes de desarrollo sembrados.");
        }

        private async Task SeedAdministradorAsync(CancellationToken ct)
        {
            if (await context.Persona.AnyAsync(p => p.Documento == DocumentoAdministrador, ct)) return;

            var ahora = DateTime.Now;

            var admin = new Administrador
            {
                Persona = NuevaPersona("Martín", "Ruiz", DocumentoAdministrador, "M", new DateOnly(1980, 9, 2))
            };
            admin.Persona.Usuario = new Usuario
            {
                CorreoElectronico = "admin@demo.com",
                Contrasenia = hasher.Hash("Admin1234!"),
                FechaAlta = ahora,
                Rol = RolUsuario.Administrador,
                Estado = EstadoCuenta.Aprobado,
                FechaSolicitud = ahora,
                AceptoTerminos = true,
                FechaAceptacionTerminos = ahora
            };

            context.Administrador.Add(admin);
            await context.SaveChangesAsync(ct);
            logger.LogInformation("Administrador de desarrollo sembrado (usuario admin@demo.com).");
        }

        private async Task SeedPsicopedagogoAsync(CancellationToken ct)
        {
            if (await context.Persona.AnyAsync(p => p.Documento == DocumentoPsicopedagogo, ct)) return;

            var ahora = DateTime.Now;

            var psico = new Psicopedagogo
            {
                Avatar = "avatar-demo.png",
                Telefono = "3515551234",
                Matricula = "MP 1234",
                Persona = NuevaPersona("Laura", "Gómez", DocumentoPsicopedagogo, "F", new DateOnly(1985, 3, 14))
            };
            psico.Persona.Usuario = new Usuario
            {
                CorreoElectronico = "psico@demo.com",
                Contrasenia = hasher.Hash("Demo1234!"),
                FechaAlta = ahora,
                Rol = RolUsuario.Psicopedagogo,
                Estado = EstadoCuenta.Aprobado,
                FechaSolicitud = ahora,
                AceptoTerminos = true,
                FechaAceptacionTerminos = ahora
            };

            var juan = NuevoPaciente("Juan", "Perez", "56058870", "M", new DateOnly(2018, 5, 12), "Av. Colón 559", ahora);
            var melina = NuevoPaciente("Melina", "Romero", "65221087", "F", new DateOnly(2019, 8, 3), "Bv. San Juan 1020", ahora);
            var cristian = NuevoPaciente("Cristian", "Sosa", "54576522", "M", new DateOnly(2018, 2, 20), "Obispo Trejo 340", ahora);

            psico.PsicopedagogoPacientes.Add(Vinculo(juan, ahora.AddDays(-30), "Mejorar la lectura comprensiva.",
                "Buena disposición. Se distrae con estímulos auditivos.", [DifAtencion],
                NuevaSesion(ahora.AddDays(-21), EjercicioResuelto(ImagenIgual, 8, 2, 75, 10), EjercicioResuelto(Memorama, 15, 4, 122, 19)),
                NuevaSesion(ahora.AddDays(-14), EjercicioResuelto(DesafioNumeros, 9, 4, 101, 13)),
                NuevaSesion(ahora.AddDays(-7), EjercicioResuelto(ImagenIgual, 10, 1, 68, 11), EjercicioResuelto(Memorama, 17, 3, 110, 21))));

            psico.PsicopedagogoPacientes.Add(Vinculo(melina, ahora.AddDays(-12), "Mejorar la lectoescritura.",
                "Lee con apoyo. Cuesta la escritura de palabras largas.", [DifLectoescritura],
                NuevaSesion(ahora.AddDays(-10), EjercicioResuelto(ComprensionTexto, 6, 3, 180, 0), EjercicioResuelto(ConectarPalabras, 8, 2, 95, 9)),
                NuevaSesion(ahora.AddDays(-3), EjercicioResuelto(Dictado, 7, 3, 140, 0))));

            psico.PsicopedagogoPacientes.Add(Vinculo(cristian, ahora.AddDays(-6), "Afianzar el cálculo mental.",
                "Se frustra ante errores. Responde bien al refuerzo positivo.", [DifCalculo, DifMemoria],
                NuevaSesion(ahora.AddDays(-5), EjercicioResuelto(SumasRestas, 12, 5, 130, 17), EjercicioResuelto(SeriesNumericas, 9, 3, 115, 12))));

            context.Psicopedagogo.Add(psico);

            await context.SaveChangesAsync(ct);
            logger.LogInformation("Datos de desarrollo sembrados (usuario psico@demo.com).");
        }

        private static Persona NuevaPersona(string nombre, string apellido, string documento, string genero, DateOnly nacimiento)
            => new()
            {
                Nombre = nombre,
                Apellido = apellido,
                Documento = documento,
                Genero = genero,
                FechaNacimiento = nacimiento
            };

        private static Paciente NuevoPaciente(string nombre, string apellido, string documento, string genero, DateOnly nacimiento, string direccion, DateTime fechaAlta)
            => new()
            {
                Direccion = direccion,
                FechaAlta = fechaAlta,
                Persona = NuevaPersona(nombre, apellido, documento, genero, nacimiento)
            };

        private static PsicopedagogoPaciente Vinculo(Paciente paciente, DateTime fechaInicio, string objetivo, string observaciones, int[] dificultades, params Sesion[] sesiones)
            => new()
            {
                Paciente = paciente,
                FechaInicio = fechaInicio,
                Intervencion = new Intervencion
                {
                    objetivo = objetivo,
                    observaciones = observaciones,
                    TiposDificultad = dificultades.Select(id => new IntervencionTipoDificultad { TipoDificultadId = id }).ToList()
                },
                Sesiones = sesiones.ToList()
            };

        private static Sesion NuevaSesion(DateTime fecha, params SesionEjercicio[] ejercicios)
        {
            // Cada ejercicio se registra unos minutos después del anterior.
            for (var i = 0; i < ejercicios.Length; i++)
            {
                ejercicios[i].Resultado!.FechaRegistro = fecha.AddMinutes(10 * (i + 1));
            }

            return new Sesion { Fecha = fecha, SesionEjercicios = ejercicios.ToList() };
        }

        private static SesionEjercicio EjercicioResuelto(int ejercicioId, int aciertos, int errores, int segundos, int movimientos)
            => new()
            {
                EjercicioId = ejercicioId,
                Resultado = new Resultado
                {
                    Aciertos = aciertos,
                    Errores = errores,
                    TiempoSegundos = segundos,
                    Observaciones = Obs,
                    ResultadoMetricas = movimientos > 0
                        ? new List<ResultadoMetrica> { new() { MetricaId = Movimientos, Valor = movimientos } }
                        : new List<ResultadoMetrica>()
                }
            };
    }
}
