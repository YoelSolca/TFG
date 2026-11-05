using Backend.Application.Interfaces;
using Backend.Application.Options;
using Backend.Domain.Interfaces;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Email;
using Backend.Infrastructure.Queries;
using Backend.Infrastructure.Repositories;
using Backend.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"),
                sql => sql.EnableRetryOnFailure());
            });

            services.AddScoped<DevelopmentDataSeeder>();
            services.AddScoped<IPersonaRepository, PersonaRepository>();
            services.AddScoped<IPsicopedagogoRepository, PsicopedagogoRepository>();
            services.AddScoped<IPacienteRepository, PacienteRepository>();
            services.AddScoped<IPacienteQueries, PacienteQueries>();
            services.AddScoped<ITipoDificultadQueries, TipoDificultadQueries>();
            services.AddScoped<IUsuarioRepository, UsuarioRepository>();
            services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
            services.AddScoped<ITokenGenerator, JwtTokenGenerator>();
            services.AddScoped<IEjercicioRepository, EjercicioRepository>();
            services.AddScoped<ISesionRepository, SesionRepository>();
            services.AddScoped<IMetricaRepository, MetricaRepository>();
            services.AddScoped<IResultadoRepository, ResultadoRepository>();
            services.AddScoped<IInformeRepository, InformeRepository>();
            services.AddScoped<ITipoEjercicioQueries, TipoEjercicioQueries>();

            services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
            services.AddScoped<IEmailSender, SmtpEmailSender>();

            return services;
        }
    }
}
