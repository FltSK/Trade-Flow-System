using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddIslemTarihiToDukkanCarisi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "IslemTarihi",
                table: "DukkanCarisi",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_DukkanCarisi_IslemTarihi",
                table: "DukkanCarisi",
                column: "IslemTarihi");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DukkanCarisi_IslemTarihi",
                table: "DukkanCarisi");

            migrationBuilder.DropColumn(
                name: "IslemTarihi",
                table: "DukkanCarisi");
        }
    }
}
