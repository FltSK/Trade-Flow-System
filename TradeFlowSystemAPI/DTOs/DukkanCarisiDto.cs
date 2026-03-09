namespace TradeFlowSystemAPI.DTOs
{
    public class DukkanCarisiDto
    {
        public int Id { get; set; }
        public string Aciklama { get; set; } = string.Empty;
        public decimal Tutar { get; set; }
        public string YapanKullanici { get; set; } = string.Empty;
        public string YapilanIslem { get; set; } = string.Empty;
        public DateTime IslemTarihi { get; set; }
        public DateTime OlusturmaTarihi { get; set; }
        public DateTime? GuncellemeTarihi { get; set; }
        public string GuncelleyenKullanici { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
    }

    public class CreateDukkanCarisiDto
    {
        public string Aciklama { get; set; } = string.Empty;
        public decimal Tutar { get; set; }
        public string YapanKullanici { get; set; } = string.Empty;
        public string YapilanIslem { get; set; } = string.Empty;
        public DateTime IslemTarihi { get; set; }
    }

    public class UpdateDukkanCarisiDto
    {
        public string Aciklama { get; set; } = string.Empty;
        public decimal Tutar { get; set; }
        public string YapilanIslem { get; set; } = string.Empty;
        public DateTime IslemTarihi { get; set; }
        public string GuncelleyenKullanici { get; set; } = string.Empty;
    }
} 