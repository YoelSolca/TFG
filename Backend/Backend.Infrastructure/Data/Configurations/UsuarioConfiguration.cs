using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
    {
        public void Configure(EntityTypeBuilder<Usuario> builder)
        {
            builder.ToTable("Usuario");

            builder.HasKey(u => u.PersonaId);
            builder.Property(u => u.CorreoElectronico)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(u => u.Contrasenia)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(u => u.FechaExpiracionTokenRestablecimiento);
            builder.Property(u => u.FechaRecuperacion);

            builder.Property(u => u.SecretoDobleFactor)
                .HasMaxLength(100);

            builder.Property(u => u.DobleFactorHabilitado)
                .IsRequired()
                .HasDefaultValue(false);

            // Los enums se guardan como texto para que la base sea legible.
            builder.Property(u => u.Rol)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(u => u.Estado)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(20);

            builder.Property(u => u.FechaSolicitud).IsRequired();
            builder.Property(u => u.AceptoTerminos).IsRequired();

            builder.HasIndex(u => u.CorreoElectronico).IsUnique();
            builder.HasIndex(u => u.Estado);

            // El historial es de solo lectura hacia afuera: Entity Framework lo carga y lo guarda por el campo privado.
            builder.Navigation(u => u.Historial).UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasOne(u => u.Persona)
                  .WithOne(p => p.Usuario)
                  .HasForeignKey<Usuario>(u => u.PersonaId)
                  .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
