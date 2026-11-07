using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class PacienteConfiguration : IEntityTypeConfiguration<Paciente>
    {
        public void Configure(EntityTypeBuilder<Paciente> builder)
        {
            builder.ToTable("Paciente");
            builder.HasKey(p => p.PersonaId);

            // Las colecciones son de solo lectura hacia afuera: Entity Framework las carga y guarda por el campo privado.
            builder.Navigation(p => p.PsicopedagogoPacientes).UsePropertyAccessMode(PropertyAccessMode.Field);

            builder.HasOne(p => p.Persona)
                   .WithOne(pa => pa.Paciente)
                   .HasForeignKey<Paciente>(p => p.PersonaId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
