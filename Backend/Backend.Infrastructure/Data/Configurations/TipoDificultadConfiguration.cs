using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class TipoDificultadConfiguration : IEntityTypeConfiguration<TipoDificultad>
    {
        public void Configure(EntityTypeBuilder<TipoDificultad> builder)
        {
            builder.ToTable("TipoDificultad");
            builder.Navigation(x => x.IntervencionTiposDificultad).UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasKey(t => t.Id);
            builder.Property(t => t.Nombre).IsRequired().HasMaxLength(50);

            builder.HasIndex(t => t.Nombre).IsUnique();

            builder.HasData(
                new { Id = 1, Nombre = "Dificultades de atención" },
                new { Id = 2, Nombre = "Dificultades en lectoescritura" },
                new { Id = 3, Nombre = "Dificultades en cálculo" },
                new { Id = 4, Nombre = "Dificultades en memoria" });
        }
    }
}
