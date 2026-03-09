using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddDukkanCarisi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DukkanCarisi",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Aciklama = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Tutar = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    YapanKullanici = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    YapilanIslem = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OlusturmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    GuncellemeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    GuncelleyenKullanici = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DukkanCarisi", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DukkanCarisi_OlusturmaTarihi",
                table: "DukkanCarisi",
                column: "OlusturmaTarihi");

            migrationBuilder.CreateIndex(
                name: "IX_DukkanCarisi_YapanKullanici",
                table: "DukkanCarisi",
                column: "YapanKullanici");

            migrationBuilder.CreateIndex(
                name: "IX_DukkanCarisi_YapilanIslem",
                table: "DukkanCarisi",
                column: "YapilanIslem");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DukkanCarisi");
        }
    }
}
