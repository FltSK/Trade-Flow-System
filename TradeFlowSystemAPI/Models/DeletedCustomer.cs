using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class DeletedCustomer
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
        
        [StringLength(100)]
        public string? ToptanciIsmi { get; set; }
        
        [StringLength(100)]
        public string? UstaIsmi { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Ekleyen kullanıcı bilgileri
        public int CreatedByUserId { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;
        
        // Silme bilgileri
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow;
        public int DeletedByUserId { get; set; }
        public string DeletedByUsername { get; set; } = string.Empty;
        
        // Geri alma bilgileri
        public DateTime? RestoredAt { get; set; }
        public int? RestoredByUserId { get; set; }
        public string? RestoredByUsername { get; set; }
        public bool IsRestored { get; set; } = false;
    }
} 