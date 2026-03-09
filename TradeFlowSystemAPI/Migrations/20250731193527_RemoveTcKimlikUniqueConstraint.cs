using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTcKimlikUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // TC Kimlik unique constraint'ini kaldır
            migrationBuilder.DropIndex(
                name: "IX_Customers_TcKimlik",
                table: "Customers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // TC Kimlik unique constraint'ini geri ekle
            migrationBuilder.CreateIndex(
                name: "IX_Customers_TcKimlik",
                table: "Customers",
                column: "TcKimlik",
                unique: true);
        }
    }
}
