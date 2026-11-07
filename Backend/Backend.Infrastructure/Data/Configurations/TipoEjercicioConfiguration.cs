using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class TipoEjercicioConfiguration : IEntityTypeConfiguration<TipoEjercicio>
    {
        public void Configure(EntityTypeBuilder<TipoEjercicio> builder)
        {
            builder.ToTable("TipoEjercicio");
            builder.Navigation(x => x.Ejercicios).UsePropertyAccessMode(PropertyAccessMode.Field);
            builder.HasKey(t => t.Id);

            builder.HasData(
                new { Id = 1, Nombre = "Atención", icono = "atencion" },
                new { Id = 2, Nombre = "Memoria", icono = "memoria" },
                new { Id = 3, Nombre = "Lectura", icono = "lectura" },
                new { Id = 4, Nombre = "Escritura", icono = "escritura" },
                new { Id = 5, Nombre = "Cálculo", icono = "calculo" });
        }
    }
}
