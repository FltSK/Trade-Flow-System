using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class Usta
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string AdSoyad { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? Telefon { get; set; }
        
        [StringLength(200)]
        public string? Adres { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }
        
        [StringLength(100)]
        public string? UzmanlikAlani { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Ekleyen kullanıcı bilgileri
        public int CreatedByUserId { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;

        public void UpdateTimestamp()
        {
            UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
        }
    }
} 