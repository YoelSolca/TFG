using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CatalogoEjercicios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Los ejercicios que salen del catálogo (3 y 10) no pueden dejar datos colgados: las relaciones son restrictivas,
            // así que primero se borra lo que dependía de ellos, de adentro hacia afuera, y al final las sesiones que
            // quedaron sin ningún ejercicio. En una base sin esos datos no borra nada.
            migrationBuilder.Sql("""
                DECLARE @sesionesAfectadas TABLE (Id int);
                INSERT INTO @sesionesAfectadas SELECT DISTINCT SesionId FROM SesionEjercicio WHERE EjercicioId IN (3, 10);

                DELETE FROM ResultadoMetrica WHERE EjercicioId IN (3, 10);
                DELETE FROM Resultado WHERE EjercicioId IN (3, 10);
                DELETE FROM SesionEjercicio WHERE EjercicioId IN (3, 10);

                DELETE FROM Sesion
                WHERE Id IN (SELECT Id FROM @sesionesAfectadas)
                  AND NOT EXISTS (SELECT 1 FROM SesionEjercicio WHERE SesionEjercicio.SesionId = Sesion.Id);
                """);

            migrationBuilder.DeleteData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.InsertData(
                table: "Ejercicio",
                columns: new[] { "Id", "Descripcion", "Nombre", "TipoEjercicioId" },
                values: new object[,]
                {
                    { 11, "Se muestra una secuencia de colores o figuras y hay que repetirla en el mismo orden. Trabaja la memoria de trabajo y la atención sostenida.", "Repetí la secuencia", 2 },
                    { 12, "Se ordenan las letras desordenadas para formar la palabra que muestra el dibujo. Trabaja la ortografía y la escritura de palabras.", "Ordená las letras", 4 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.InsertData(
                table: "Ejercicio",
                columns: new[] { "Id", "Descripcion", "Nombre", "TipoEjercicioId" },
                values: new object[,]
                {
                    { 3, "Se ordenan los elementos según su color. Trabaja la atención sostenida y la clasificación.", "Clasificar colores", 1 },
                    { 10, "Ejercicios numéricos con tiempo limitado. Trabaja la agilidad en el cálculo.", "Desafío de números", 5 }
                });
        }
    }
}
