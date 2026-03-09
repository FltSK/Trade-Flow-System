namespace TradeFlowSystemAPI.DTOs
{
    public class CreateCustomerSoldDeviceDto
    {
        public int StokId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? DaireBilgisi { get; set; }
        // Yeni alanlar: ödeme mantığına paralel olarak metinsel seçimler
        public string? YapilanIs { get; set; }
        public string? SatilanCihaz { get; set; }
        public string? BoruTipi { get; set; }
        public string? Termostat { get; set; }
    }
}


