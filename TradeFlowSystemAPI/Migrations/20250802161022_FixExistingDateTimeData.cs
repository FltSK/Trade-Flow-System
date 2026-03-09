using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixExistingDateTimeData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Mevcut DateTime verilerini UTC'ye çevir
            migrationBuilder.Sql(@"
                UPDATE ""Customers"" 
                SET ""CreatedAt"" = ""CreatedAt"" AT TIME ZONE 'UTC',
                    ""UpdatedAt"" = ""UpdatedAt"" AT TIME ZONE 'UTC'
                WHERE ""CreatedAt"" IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""Payments"" 
                SET ""CreatedAt"" = ""CreatedAt"" AT TIME ZONE 'UTC',
                    ""UpdatedAt"" = ""UpdatedAt"" AT TIME ZONE 'UTC'
                WHERE ""CreatedAt"" IS NOT NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ""DeletedCustomers"" 
                SET ""CreatedAt"" = ""CreatedAt"" AT TIME ZONE 'UTC',
                    ""UpdatedAt"" = ""UpdatedAt"" AT TIME ZONE 'UTC',
                    ""DeletedAt"" = ""DeletedAt"" AT TIME ZONE 'UTC'
                WHERE ""CreatedAt"" IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
