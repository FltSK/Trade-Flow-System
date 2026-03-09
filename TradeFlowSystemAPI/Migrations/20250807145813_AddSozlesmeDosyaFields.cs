using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSozlesmeDosyaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SozlesmeDosyaAdi",
                table: "Customers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "SozlesmeDosyaBoyutu",
                table: "Customers",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SozlesmeDosyaTipi",
                table: "Customers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SozlesmeDosyaYolu",
                table: "Customers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SozlesmeDosyaAdi",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "SozlesmeDosyaBoyutu",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "SozlesmeDosyaTipi",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "SozlesmeDosyaYolu",
                table: "Customers");
        }
    }
}
