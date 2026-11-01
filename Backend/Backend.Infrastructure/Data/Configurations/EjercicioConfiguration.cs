
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Data.Configurations
{
    public class EjercicioConfiguration : IEntityTypeConfiguration<Ejercicio>
    {
        public void Configure(EntityTypeBuilder<Ejercicio> builder)
        {

            builder.ToTable("Ejercicio");
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            builder.Property(e => e.Descripcion).HasMaxLength(300);

            builder.HasOne(e => e.TipoEjercicio)
                    .WithMany(p => p.Ejercicios)
                    .HasForeignKey(e => e.TipoEjercicioId)
                    .OnDelete(DeleteBehavior.Restrict);

            builder.HasData(
                new Ejercicio { Id = 1, Nombre = "Encontrá la imagen igual", TipoEjercicioId = 1, Descripcion = "Hay que encontrar, entre varias imágenes, la que es idéntica al modelo. Trabaja la atención visual y la discriminación." },
                new Ejercicio { Id = 2, Nombre = "Sombras y animales", TipoEjercicioId = 1, Descripcion = "Se relaciona cada animal con su sombra. Trabaja la atención y la percepción visual." },
                new Ejercicio { Id = 3, Nombre = "Clasificar colores", TipoEjercicioId = 1, Descripcion = "Se ordenan los elementos según su color. Trabaja la atención sostenida y la clasificación." },
                new Ejercicio { Id = 4, Nombre = "Memorama", TipoEjercicioId = 2, Descripcion = "Juego de parejas: se dan vuelta cartas para encontrar las iguales. Trabaja la memoria visual y de corto plazo." },
                new Ejercicio { Id = 5, Nombre = "Conectar palabras", TipoEjercicioId = 3, Descripcion = "Se unen palabras con su imagen o significado. Trabaja el vocabulario y la lectura." },
                new Ejercicio { Id = 6, Nombre = "Comprensión de texto", TipoEjercicioId = 3, Descripcion = "Se lee un texto breve y se responden preguntas sobre su contenido. Trabaja la comprensión lectora." },
                new Ejercicio { Id = 7, Nombre = "Dictado de palabras", TipoEjercicioId = 4, Descripcion = "Se escuchan palabras y se escriben correctamente. Trabaja la ortografía y la escritura." },
                new Ejercicio { Id = 8, Nombre = "Sumas y restas", TipoEjercicioId = 5, Descripcion = "Operaciones básicas de suma y resta. Trabaja el cálculo mental." },
                new Ejercicio { Id = 9, Nombre = "Series numéricas", TipoEjercicioId = 5, Descripcion = "Hay que completar la secuencia con el número que falta. Trabaja el razonamiento lógico y el cálculo." },
                new Ejercicio { Id = 10, Nombre = "Desafío de números", TipoEjercicioId = 5, Descripcion = "Ejercicios numéricos con tiempo limitado. Trabaja la agilidad en el cálculo." });
        }
    }
}
