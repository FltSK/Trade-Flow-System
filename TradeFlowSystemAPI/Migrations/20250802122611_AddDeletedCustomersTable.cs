using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddDeletedCustomersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeletedCustomers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AdSoyad = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TcKimlik = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: false),
                    Telefon = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Adres = table.Column<string>(type: "text", nullable: true),
                    SozlesmeTutari = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    SozlesmeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    OdemeTaahhutTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RandevuTarihi = table.Column<DateOnly>(type: "date", nullable: true),
                    YapilanIs = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    BoruTipi = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SatilanCihaz = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Termostat = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ToptanciIsmi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedByUserId = table.Column<int>(type: "integer", nullable: false),
                    DeletedByUsername = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RestoredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RestoredByUserId = table.Column<int>(type: "integer", nullable: true),
                    RestoredByUsername = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    IsRestored = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeletedCustomers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeletedCustomers_AdSoyad",
                table: "DeletedCustomers",
                column: "AdSoyad");

            migrationBuilder.CreateIndex(
                name: "IX_DeletedCustomers_DeletedAt",
                table: "DeletedCustomers",
                column: "DeletedAt");

            migrationBuilder.CreateIndex(
                name: "IX_DeletedCustomers_IsRestored",
                table: "DeletedCustomers",
                column: "IsRestored");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeletedCustomers");
        }
    }
}
