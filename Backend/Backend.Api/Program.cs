using Backend.Api.Security;
using Backend.Application;
using Backend.Application.Interfaces;
using Backend.Application.Options;
using Backend.Domain.Entities;
using Backend.Domain.Interfaces;
using Backend.Infrastructure;
using Backend.Infrastructure.Data;
using Backend.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
// Credenciales locales (SMTP, etc.): el archivo está en .gitignore, así que no se sube al repositorio.
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Missing 'Jwt' configuration section");
// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Token obtenido en POST /api/auth/login"
    });
    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
}); 

builder.Services.AddProblemDetails();
builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);


builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUsuarioActual, UsuarioActual>();


builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        // Un token firmado y vigente no alcanza: la cuenta tiene que seguir aprobada. Se consulta en cada pedido
        // (una consulta chica por id) para que suspender o rechazar corte el acceso al instante, sin esperar a que venza el token.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var id = context.Principal?.FindFirst(JwtTokenGenerator.UserClaim)?.Value;
                var rol = context.Principal?.FindFirst(JwtTokenGenerator.RolClaim)?.Value;

                // Los tokens viejos no traen el rol: se piden de nuevo iniciando sesión.
                if (!int.TryParse(id, out var usuarioId) || string.IsNullOrEmpty(rol))
                {
                    context.Fail("Sesión inválida: volvé a iniciar sesión.");
                    return;
                }

                var usuarios = context.HttpContext.RequestServices.GetRequiredService<IUsuarioRepository>();
                if (!await usuarios.EstaHabilitadaAsync(usuarioId, context.HttpContext.RequestAborted))
                    context.Fail("La cuenta no está habilitada.");
            }
        };
    });

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", optionsCORS =>
    {
        optionsCORS.WithOrigins(allowedOrigins)
                   .AllowAnyHeader()
                   .AllowAnyMethod();
    });
});

builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
    // Solo el administrador aprueba, rechaza y suspende cuentas y ve los datos de todos los profesionales.
    .AddPolicy(Politicas.Administrador, policy => policy
        .RequireAuthenticatedUser()
        .RequireClaim(JwtTokenGenerator.RolClaim, nameof(RolUsuario.Administrador)));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Backend");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "Documentación Backend";
    });
}
else
{
    app.UseExceptionHandler();
}

app.UseHttpsRedirection();

app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    try
    {
        await scope.ServiceProvider.GetRequiredService<DevelopmentDataSeeder>().SeedAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "No se pudieron sembrar los datos de desarrollo.");
    }
}

app.Run();
