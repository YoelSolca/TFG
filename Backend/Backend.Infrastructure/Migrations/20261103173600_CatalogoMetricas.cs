using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Backend.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CatalogoMetricas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Metrica",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Metrica",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.InsertData(
                table: "Metrica",
                columns: new[] { "Id", "Descripcion", "Nombre", "TipoAgregacion", "Unidad" },
                values: new object[] { 4, "Pistas usadas durante el ejercicio", "pistas", "Suma", null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Metrica",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.InsertData(
                table: "Metrica",
                columns: new[] { "Id", "Descripcion", "Nombre", "TipoAgregacion", "Unidad" },
                values: new object[,]
                {
                    { 2, "Estímulos omitidos", "omisiones", "Suma", null },
                    { 3, "Nivel máximo alcanzado", "nivelAlcanzado", "Maximo", null }
                });
        }
    }
}
