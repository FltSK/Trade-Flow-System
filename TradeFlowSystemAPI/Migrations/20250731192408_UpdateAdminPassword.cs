using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAdminPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Eski admin kullanıcısını sil
            migrationBuilder.Sql("DELETE FROM \"Users\" WHERE \"Username\" = 'admin'");
            
            // Yeni admin kullanıcısı ekle
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Username", "Password", "Role", "CreatedAt", "UpdatedAt" },
                values: new object[] { "admin", "$2a$11$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", "admin", DateTime.UtcNow, DateTime.UtcNow });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
