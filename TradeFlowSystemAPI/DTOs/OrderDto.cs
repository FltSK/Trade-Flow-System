namespace TradeFlowSystemAPI.DTOs
{
    public class OrderDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int StokId { get; set; }
        public string StokAdi { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int Miktar { get; set; }
        public DateTime SiparisTarihi { get; set; }
        public DateTime? TahsisTarihi { get; set; }
        public DateTime? TamamlanmaTarihi { get; set; }
        public string? Notlar { get; set; }
        public string OlusturanKullanici { get; set; } = string.Empty;
        public DateTime OlusturmaTarihi { get; set; }
    }

    public class CreateOrderDto
    {
        public int CustomerId { get; set; }
        public int StokId { get; set; }
        public int Miktar { get; set; } = 1;
        public string? Notlar { get; set; }
        public string OlusturanKullanici { get; set; } = string.Empty;
    }

    public class UpdateOrderDto
    {
        public string Status { get; set; } = string.Empty;
        public DateTime? TahsisTarihi { get; set; }
        public DateTime? TamamlanmaTarihi { get; set; }
        public string? Notlar { get; set; }
        public string GuncelleyenKullanici { get; set; } = string.Empty;
    }
} 