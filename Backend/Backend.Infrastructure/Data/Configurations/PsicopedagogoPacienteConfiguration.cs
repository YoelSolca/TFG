using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class PsicopedagogoPacienteConfiguration: IEntityTypeConfiguration<PsicopedagogoPaciente>
    {
        public void Configure(EntityTypeBuilder<PsicopedagogoPaciente> builder)
        {
            builder.ToTable("PsicopedagogoPaciente");

            builder.HasKey(x => new { x.PsicopedagogoId, x.PacienteId });

            // Restrict de este lado: Persona llega a esta tabla por dos caminos (via Paciente y via
            // Psicopedagogo) y SQL Server no admite dos cascadas al mismo destino (error 1785).
            // Efecto: no se puede borrar un psicopedagogo con pacientes asignados hasta desvincularlos.
            builder.HasOne(x => x.Psicopedagogo)
                .WithMany(x => x.PsicopedagogoPacientes)
                .HasForeignKey(x => x.PsicopedagogoId)
                .OnDelete(DeleteBehavior.Restrict);


            builder.HasOne(x => x.Paciente)
                .WithMany(x => x.PsicopedagogoPacientes)
                .HasForeignKey(x => x.PacienteId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(x => x.FechaInicio).IsRequired();

            builder.Navigation(x => x.Sesiones).UsePropertyAccessMode(PropertyAccessMode.Field);

            // 1 a 1: cada atención tiene su propia intervención (índice único implícito en IntervencionId).
            builder.HasOne(x => x.Intervencion)
                .WithOne(i => i.PsicopedagogoPaciente)
                .HasForeignKey<PsicopedagogoPaciente>(x => x.IntervencionId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
