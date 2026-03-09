using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixStokHareketiRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StokHareketleri_Stoklar_StokId1",
                table: "StokHareketleri");

            migrationBuilder.DropIndex(
                name: "IX_StokHareketleri_StokId1",
                table: "StokHareketleri");

            migrationBuilder.DropColumn(
                name: "StokId1",
                table: "StokHareketleri");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StokId1",
                table: "StokHareketleri",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StokHareketleri_StokId1",
                table: "StokHareketleri",
                column: "StokId1");

            migrationBuilder.AddForeignKey(
                name: "FK_StokHareketleri_Stoklar_StokId1",
                table: "StokHareketleri",
                column: "StokId1",
                principalTable: "Stoklar",
                principalColumn: "Id");
        }
    }
}
