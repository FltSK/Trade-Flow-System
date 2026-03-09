using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerIdToStokHareketi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "StokHareketleri",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StokHareketleri_CustomerId",
                table: "StokHareketleri",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_StokHareketleri_Customers_CustomerId",
                table: "StokHareketleri",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StokHareketleri_Customers_CustomerId",
                table: "StokHareketleri");

            migrationBuilder.DropIndex(
                name: "IX_StokHareketleri_CustomerId",
                table: "StokHareketleri");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "StokHareketleri");
        }
    }
}
