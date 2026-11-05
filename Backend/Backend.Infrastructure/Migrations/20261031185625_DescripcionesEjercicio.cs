using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DescripcionesEjercicio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 1,
                column: "Descripcion",
                value: "Hay que encontrar, entre varias imágenes, la que es idéntica al modelo. Trabaja la atención visual y la discriminación.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 2,
                column: "Descripcion",
                value: "Se relaciona cada animal con su sombra. Trabaja la atención y la percepción visual.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 3,
                column: "Descripcion",
                value: "Se ordenan los elementos según su color. Trabaja la atención sostenida y la clasificación.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 4,
                column: "Descripcion",
                value: "Juego de parejas: se dan vuelta cartas para encontrar las iguales. Trabaja la memoria visual y de corto plazo.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 5,
                column: "Descripcion",
                value: "Se unen palabras con su imagen o significado. Trabaja el vocabulario y la lectura.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 6,
                column: "Descripcion",
                value: "Se lee un texto breve y se responden preguntas sobre su contenido. Trabaja la comprensión lectora.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 7,
                column: "Descripcion",
                value: "Se escuchan palabras y se escriben correctamente. Trabaja la ortografía y la escritura.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 8,
                column: "Descripcion",
                value: "Operaciones básicas de suma y resta. Trabaja el cálculo mental.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 9,
                column: "Descripcion",
                value: "Hay que completar la secuencia con el número que falta. Trabaja el razonamiento lógico y el cálculo.");

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 10,
                column: "Descripcion",
                value: "Ejercicios numéricos con tiempo limitado. Trabaja la agilidad en el cálculo.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 1,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 2,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 3,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 4,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 5,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 6,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 7,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 8,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 9,
                column: "Descripcion",
                value: null);

            migrationBuilder.UpdateData(
                table: "Ejercicio",
                keyColumn: "Id",
                keyValue: 10,
                column: "Descripcion",
                value: null);
        }
    }
}
