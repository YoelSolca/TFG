using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class ResultadoConfiguration : IEntityTypeConfiguration<Resultado>
    {
        public void Configure(EntityTypeBuilder<Resultado> builder)
        {
            builder.ToTable("Resultado");

            builder.HasKey(r => new { r.SesionId, r.EjercicioId });
            builder.Property(r => r.Observaciones).HasMaxLength(500);

            builder.Navigation(r => r.ResultadoMetricas).UsePropertyAccessMode(PropertyAccessMode.Field);

            // Restrict: no perder el resultado de un ejercicio en silencio si algún día se borra el vínculo.
            builder.HasOne(r => r.SesionEjercicio)
                .WithOne(se => se.Resultado)
                .HasForeignKey<Resultado>(r => new { r.SesionId, r.EjercicioId })
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
