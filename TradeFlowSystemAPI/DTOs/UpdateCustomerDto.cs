using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class UpdateCustomerDto
    {
        [Required]
        [StringLength(100)]
        public string AdSoyad { get; set; } = string.Empty;
        
        [Required]
        [StringLength(11)]
        public string TcKimlik { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? Telefon { get; set; }
        
        public string? Adres { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal SozlesmeTutari { get; set; }
        
        public DateTime? SozlesmeTarihi { get; set; }
        
        [Required]
        public DateTime OdemeTaahhutTarihi { get; set; }
        
        [StringLength(200)]
        public string? YapilanIs { get; set; }
        
        [StringLength(50)]
        public string? BoruTipi { get; set; }
        
        [StringLength(200)]
        public string? SatilanCihaz { get; set; }

        // Satılan cihaz stok kaydı (opsiyonel, sadece güncellemede doğru stok eşleşmesi için)
        public int? SatilanStokId { get; set; }

        // Düzenlemede eski satılan stok id'si (iade için)
        public int? OldSatilanStokId { get; set; }
        
        [StringLength(100)]
        public string? Termostat { get; set; }
        
        [StringLength(200)]
        public string? DaireBilgisi { get; set; }
        
        [StringLength(100)]
        public string? UstaIsmi { get; set; }
        
        [StringLength(100)]
        public string? ToptanciIsmi { get; set; }
        
        public bool? HesapYapildi { get; set; }

        // Sözleşme dosyası bilgileri (opsiyonel)
        public string? SozlesmeDosyaAdi { get; set; }
        public string? SozlesmeDosyaYolu { get; set; }
        public long? SozlesmeDosyaBoyutu { get; set; }
        public string? SozlesmeDosyaTipi { get; set; }

        // Çoklu satılan cihazlar (opsiyonel)
        public List<CreateCustomerSoldDeviceDto>? SoldDevices { get; set; }
    }
} 