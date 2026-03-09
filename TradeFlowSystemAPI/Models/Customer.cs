using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class Customer
    {
        public int Id { get; set; }
        
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
        
        public DateOnly? RandevuTarihi { get; set; }
        
        [StringLength(200)]
        public string? YapilanIs { get; set; }
        
        [StringLength(50)]
        public string? BoruTipi { get; set; }
        
        [StringLength(200)]
        public string? SatilanCihaz { get; set; }
        
        [StringLength(100)]
        public string? Termostat { get; set; }
        
        // DB'den kaldırıldı (EF ignore ediyor)
        public string? ToptanciIsmi { get; set; }
        public string? UstaIsmi { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Ekleyen kullanıcı bilgileri
        public int CreatedByUserId { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;
        
        // Hesap yapıldı mı kontrolü
        public bool HesapYapildi { get; set; } = false;

        // Sözleşme dosyası bilgileri
        public string? SozlesmeDosyaAdi { get; set; }
        public string? SozlesmeDosyaYolu { get; set; }
        public long? SozlesmeDosyaBoyutu { get; set; }
        public string? SozlesmeDosyaTipi { get; set; }

        public void UpdateTimestamp()
        {
            UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        }
        
        // Navigation properties
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
        public virtual ICollection<StokHareketi> StokHareketleri { get; set; } = new List<StokHareketi>();
    }
} 