using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tüm kullanıcıları sil
            migrationBuilder.Sql("DELETE FROM \"Users\";");

            // Yeni kullanıcıları ekle
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Password", "Role", "UpdatedAt", "Username" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "$2a$11$WfF3WQ7xQ.ByN5rW7JxLSO8hGRXLgV1yQ3k.uQy5rX2qH7X8tF9/m", "superadmin", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "superadmin" },
                    { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "$2a$11$WfF3WQ7xQ.ByN5rW7JxLSO8hGRXLgV1yQ3k.uQy5rX2qH7X8tF9/m", "admin", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin" },
                    { 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "$2a$11$WfF3WQ7xQ.ByN5rW7JxLSO8hGRXLgV1yQ3k.uQy5rX2qH7X8tF9/m", "employee", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "calisan" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Yeni kullanıcıları sil
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);

            // Eski kullanıcıları geri ekle
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Password", "Role", "UpdatedAt", "Username" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "$2a$11$WfF3WQ7xQ.ByN5rW7JxLSO8hGRXLgV1yQ3k.uQy5rX2qH7X8tF9/m", "admin", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin" }
                });
        }
    }
}
