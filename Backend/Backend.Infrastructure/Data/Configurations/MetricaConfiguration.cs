using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class MetricaConfiguration : IEntityTypeConfiguration<Metrica>
    {
        public void Configure(EntityTypeBuilder<Metrica> builder)
        {
            builder.ToTable("Metrica");

            builder.HasKey(m => m.Id);
            builder.Property(m => m.Nombre).IsRequired().HasMaxLength(50);
            builder.Property(m => m.Descripcion).HasMaxLength(200);
            builder.Property(m => m.Unidad).HasMaxLength(30);
            builder.Property(m => m.TipoAgregacion).HasConversion<string>().HasMaxLength(20);

            builder.HasIndex(m => m.Nombre).IsUnique();
    
            builder.HasData(
                new Metrica { Id = 1, Nombre = "movimientos", Descripcion = "Cantidad de movimientos realizados", TipoAgregacion = TipoAgregacion.Suma },
                new Metrica { Id = 4, Nombre = "pistas", Descripcion = "Pistas usadas durante el ejercicio", TipoAgregacion = TipoAgregacion.Suma });
        }
    }
}
