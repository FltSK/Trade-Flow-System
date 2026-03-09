using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddStokTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Stoklar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UrunTuru = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Marka = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Miktar = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MinimumStok = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    BirimFiyat = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    OlusturmaTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    GuncellemeTarihi = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OlusturanKullanici = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    GuncelleyenKullanici = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stoklar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StokHareketleri",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StokId = table.Column<int>(type: "integer", nullable: false),
                    Miktar = table.Column<int>(type: "integer", nullable: false),
                    HareketTipi = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Aciklama = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Tarih = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    KullaniciAdi = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StokHareketleri", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StokHareketleri_Stoklar_StokId",
                        column: x => x.StokId,
                        principalTable: "Stoklar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StokHareketleri_HareketTipi",
                table: "StokHareketleri",
                column: "HareketTipi");

            migrationBuilder.CreateIndex(
                name: "IX_StokHareketleri_StokId",
                table: "StokHareketleri",
                column: "StokId");

            migrationBuilder.CreateIndex(
                name: "IX_StokHareketleri_Tarih",
                table: "StokHareketleri",
                column: "Tarih");

            migrationBuilder.CreateIndex(
                name: "IX_Stoklar_Marka",
                table: "Stoklar",
                column: "Marka");

            migrationBuilder.CreateIndex(
                name: "IX_Stoklar_Miktar",
                table: "Stoklar",
                column: "Miktar");

            migrationBuilder.CreateIndex(
                name: "IX_Stoklar_Model",
                table: "Stoklar",
                column: "Model");

            migrationBuilder.CreateIndex(
                name: "IX_Stoklar_UrunTuru",
                table: "Stoklar",
                column: "UrunTuru");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StokHareketleri");

            migrationBuilder.DropTable(
                name: "Stoklar");
        }
    }
}
