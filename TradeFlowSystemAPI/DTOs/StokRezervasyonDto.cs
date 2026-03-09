namespace TradeFlowSystemAPI.DTOs
{
    public class StokRezervasyonDto
    {
        public int Id { get; set; }
        public int StokId { get; set; }
        public string StokAdi { get; set; } = string.Empty;
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int RezerveEdilenMiktar { get; set; }
        public DateTime RezervasyonTarihi { get; set; }
        public DateTime? TahsisTarihi { get; set; }
        public string Durum { get; set; } = string.Empty;
        public string? Aciklama { get; set; }
        public string OlusturanKullanici { get; set; } = string.Empty;
        public DateTime OlusturmaTarihi { get; set; }
    }

    public class CreateStokRezervasyonDto
    {
        public int StokId { get; set; }
        public int OrderId { get; set; }
        public int RezerveEdilenMiktar { get; set; }
        public string? Aciklama { get; set; }
        public string OlusturanKullanici { get; set; } = string.Empty;
    }

    public class UpdateStokRezervasyonDto
    {
        public string Durum { get; set; } = string.Empty;
        public DateTime? TahsisTarihi { get; set; }
        public string? Aciklama { get; set; }
    }
} 