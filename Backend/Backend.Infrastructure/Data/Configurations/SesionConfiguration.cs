using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Data.Configurations
{
    public class SesionConfiguration : IEntityTypeConfiguration<Sesion>
    {
        public void Configure(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<Sesion> builder)
        {
            builder.ToTable("Sesion");
            builder.Navigation(x => x.SesionEjercicios).UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasKey(s => s.Id);
            builder.Property(s => s.Fecha);
            builder.Property(s => s.Estado).IsRequired().HasConversion<string>().HasMaxLength(20);

            // Restrict: el historial no debe desaparecer en silencio al borrar un vínculo o un paciente.
            builder.HasOne(s => s.PsicopedagogoPaciente)
           .WithMany(pp => pp.Sesiones)
           .HasForeignKey(s => new { s.PsicopedagogoId, s.PacienteId })
           .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
