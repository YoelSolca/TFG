using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class IntervencionConfiguration : IEntityTypeConfiguration<Intervencion>
    {
        public void Configure(EntityTypeBuilder<Intervencion> builder)
        {
            builder.ToTable("Intervencion");

            builder.HasKey(i => i.Id);
            builder.Property(i => i.objetivo).HasMaxLength(500);
            builder.Property(i => i.observaciones).HasMaxLength(1000);
        }
    }
}
