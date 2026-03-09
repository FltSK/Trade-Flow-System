using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class DukkanCarisi
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(500)]
        public string Aciklama { get; set; } = string.Empty;
        
        [Required]
        public decimal Tutar { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string YapanKullanici { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string YapilanIslem { get; set; } = string.Empty; // "Giriş", "Çıkış" gibi
        
        [Required]
        public DateTime IslemTarihi { get; set; } = DateTime.UtcNow;
        
        public DateTime OlusturmaTarihi { get; set; } = DateTime.UtcNow;
        
        public DateTime? GuncellemeTarihi { get; set; }
        
        [MaxLength(100)]
        public string GuncelleyenKullanici { get; set; } = string.Empty;
        
        public bool IsDeleted { get; set; } = false;
    }
} 