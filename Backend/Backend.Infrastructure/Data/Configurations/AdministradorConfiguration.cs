using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class AdministradorConfiguration : IEntityTypeConfiguration<Administrador>
    {
        public void Configure(EntityTypeBuilder<Administrador> builder)
        {
            builder.ToTable("Administrador");

            builder.HasKey(a => a.PersonaId);

            builder.Navigation(a => a.CambiosRealizados).UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasOne(a => a.Persona)
                   .WithOne(p => p.Administrador)
                   .HasForeignKey<Administrador>(a => a.PersonaId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
