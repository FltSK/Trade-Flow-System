using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class Stok
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string UrunTuru { get; set; } = string.Empty; // Kombi, Klima, Isı Pompası, vb.
        
        [Required]
        [StringLength(100)]
        public string Marka { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Model { get; set; } = string.Empty;
        
        public int Miktar { get; set; } = 0;
        
        public int MinimumStok { get; set; } = 1;
        
        public decimal BirimFiyat { get; set; } = 0;
        
        public DateTime OlusturmaTarihi { get; set; } = DateTime.UtcNow;
        
        public DateTime GuncellemeTarihi { get; set; } = DateTime.UtcNow;
        
        public string OlusturanKullanici { get; set; } = string.Empty;
        
        public string GuncelleyenKullanici { get; set; } = string.Empty;
        
        public bool IsDeleted { get; set; } = false;
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        public virtual ICollection<StokHareketi> StokHareketleri { get; set; } = new List<StokHareketi>();
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
        public virtual ICollection<StokRezervasyon> StokRezervasyonlari { get; set; } = new List<StokRezervasyon>();
    }
} 