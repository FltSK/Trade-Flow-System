using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TradeFlowSystemAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerSoldDeviceTextFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Kolonlar zaten el ile silinmiş olabilir; güvenli olmak için IF EXISTS kullanılmalı ancak EF buna izin vermez.
            // Bu nedenle drop işlemlerini no-op yapıyoruz.

            // Sütunlar daha önce eklenmiş olabilir; eklemeyi atla

            

            

            

            
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: Revert adımı güvenli olması için boş bırakıldı.
        }
    }
}
