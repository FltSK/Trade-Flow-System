using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class Payment
    {
        public int Id { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal Tutar { get; set; }
        
        [Required]
        public DateTime Tarih { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Tur { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Aciklama { get; set; }
        
        [StringLength(100)]
        public string? Toptanci { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Ekleyen kullanıcı bilgileri
        public int CreatedByUserId { get; set; }
        public string CreatedByUsername { get; set; } = string.Empty;
        
        // Silen kullanıcı bilgileri
        public int? DeletedByUserId { get; set; }
        public string? DeletedByUsername { get; set; }
        
        // Navigation property
        public virtual Customer? Customer { get; set; }
    }
} 