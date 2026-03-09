namespace TradeFlowSystemAPI.DTOs
{
    public class StokDto
    {
        public int Id { get; set; }
        public string UrunTuru { get; set; } = string.Empty;
        public string Marka { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Miktar { get; set; }
        public int MinimumStok { get; set; }
        public decimal BirimFiyat { get; set; }
        public DateTime OlusturmaTarihi { get; set; }
        public DateTime GuncellemeTarihi { get; set; }
        public string OlusturanKullanici { get; set; } = string.Empty;
        public string GuncelleyenKullanici { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateStokDto
    {
        public string UrunTuru { get; set; } = string.Empty;
        public string Marka { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Miktar { get; set; }
        public int MinimumStok { get; set; } = 1;
        public decimal BirimFiyat { get; set; }
        public string OlusturanKullanici { get; set; } = string.Empty;
    }

    public class UpdateStokDto
    {
        public string UrunTuru { get; set; } = string.Empty;
        public string Marka { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Miktar { get; set; }
        public int MinimumStok { get; set; }
        public decimal BirimFiyat { get; set; }
        public string GuncelleyenKullanici { get; set; } = string.Empty;
    }

    public class StokHareketiDto
    {
        public int Id { get; set; }
        public int StokId { get; set; }
        public int? CustomerId { get; set; } // Müşteri ID'si (opsiyonel)
        public int Miktar { get; set; }
        public string HareketTipi { get; set; } = string.Empty;
        public string Aciklama { get; set; } = string.Empty;
        public DateTime Tarih { get; set; }
        public string KullaniciAdi { get; set; } = string.Empty;
    }

    public class CreateStokHareketiDto
    {
        public int StokId { get; set; }
        public int? CustomerId { get; set; } // Müşteri ID'si (opsiyonel)
        public int Miktar { get; set; }
        public string HareketTipi { get; set; } = string.Empty;
        public string Aciklama { get; set; } = string.Empty;
        public string KullaniciAdi { get; set; } = string.Empty;
    }
} 