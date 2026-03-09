using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class Order
    {
        public int Id { get; set; }
        
        public int CustomerId { get; set; }
        public virtual Customer Customer { get; set; } = null!;
        
        public int StokId { get; set; }
        public virtual Stok Stok { get; set; } = null!;
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Bekliyor"; // "Bekliyor", "TahsisEdildi", "Tamamlandi", "Iptal"
        
        public int Miktar { get; set; } = 1;
        
        public DateTime SiparisTarihi { get; set; } = DateTime.UtcNow;
        
        public DateTime? TahsisTarihi { get; set; }
        
        public DateTime? TamamlanmaTarihi { get; set; }
        
        [StringLength(500)]
        public string? Notlar { get; set; }
        
        public string OlusturanKullanici { get; set; } = string.Empty;
        
        public string? GuncelleyenKullanici { get; set; }
        
        public DateTime OlusturmaTarihi { get; set; } = DateTime.UtcNow;
        
        public DateTime GuncellemeTarihi { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<StokRezervasyon> StokRezervasyonlari { get; set; } = new List<StokRezervasyon>();
    }
} 