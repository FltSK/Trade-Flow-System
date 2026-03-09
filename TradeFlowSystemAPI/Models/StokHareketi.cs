using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class StokHareketi
    {
        public int Id { get; set; }
        
        public int StokId { get; set; }
        
        public Stok Stok { get; set; } = null!;
        
        public int? CustomerId { get; set; } // Müşteri ID'si (opsiyonel)
        
        public Customer? Customer { get; set; } // Navigation property
        
        public int Miktar { get; set; } // Pozitif: Giriş, Negatif: Çıkış
        
        [Required]
        [StringLength(20)]
        public string HareketTipi { get; set; } = string.Empty; // "Giriş" veya "Çıkış"
        
        [StringLength(500)]
        public string Aciklama { get; set; } = string.Empty;
        
        public DateTime Tarih { get; set; } = DateTime.UtcNow;
        
        public string KullaniciAdi { get; set; } = string.Empty;
    }
} 