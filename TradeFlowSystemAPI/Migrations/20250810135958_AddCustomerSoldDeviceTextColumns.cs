using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerSoldDeviceTextColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "YapilanIs",
                table: "CustomerSoldDevices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SatilanCihaz",
                table: "CustomerSoldDevices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BoruTipi",
                table: "CustomerSoldDevices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Termostat",
                table: "CustomerSoldDevices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DaireBilgisi",
                table: "CustomerSoldDevices",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "YapilanIs",
                table: "CustomerSoldDevices");

            migrationBuilder.DropColumn(
                name: "SatilanCihaz",
                table: "CustomerSoldDevices");

            migrationBuilder.DropColumn(
                name: "BoruTipi",
                table: "CustomerSoldDevices");

            migrationBuilder.DropColumn(
                name: "Termostat",
                table: "CustomerSoldDevices");

            migrationBuilder.DropColumn(
                name: "DaireBilgisi",
                table: "CustomerSoldDevices");
        }
    }
}
