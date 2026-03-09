namespace TradeFlowSystemAPI.Models
{
    public class CustomerSoldDevice
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;

        public int StokId { get; set; }
        public Stok Stok { get; set; } = null!;

        public int Quantity { get; set; }

        // Metinsel seçimler (ödeme benzeri kayıt tarihi bilgileri ile)
        public string? YapilanIs { get; set; }
        public string? SatilanCihaz { get; set; }
        public string? BoruTipi { get; set; }
        public string? Termostat { get; set; }
        public string? DaireBilgisi { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}


