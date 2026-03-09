using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class StokRezervasyon
    {
        public int Id { get; set; }
        
        public int StokId { get; set; }
        public virtual Stok Stok { get; set; } = null!;
        
        public int OrderId { get; set; }
        public virtual Order Order { get; set; } = null!;
        
        public int RezerveEdilenMiktar { get; set; }
        
        public DateTime RezervasyonTarihi { get; set; } = DateTime.UtcNow;
        
        public DateTime? TahsisTarihi { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Durum { get; set; } = "Bekliyor"; // "Bekliyor", "TahsisEdildi", "Iptal"
        
        [StringLength(500)]
        public string? Aciklama { get; set; }
        
        public string OlusturanKullanici { get; set; } = string.Empty;
        
        public DateTime OlusturmaTarihi { get; set; } = DateTime.UtcNow;
        
        public DateTime GuncellemeTarihi { get; set; } = DateTime.UtcNow;
    }
} 