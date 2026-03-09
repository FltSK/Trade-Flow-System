using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUstaSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UstaIsmi",
                table: "Customers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Ustalar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AdSoyad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Telefon = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Adres = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    UzmanlikAlani = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUsername = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ustalar", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ustalar_AdSoyad",
                table: "Ustalar",
                column: "AdSoyad");

            migrationBuilder.CreateIndex(
                name: "IX_Ustalar_CreatedAt",
                table: "Ustalar",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Ustalar_CreatedByUserId",
                table: "Ustalar",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Ustalar_IsActive",
                table: "Ustalar",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Ustalar");

            migrationBuilder.DropColumn(
                name: "UstaIsmi",
                table: "Customers");
        }
    }
}
