using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class ProductType
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Ad { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<BrandProductType> BrandProductTypes { get; set; } = new List<BrandProductType>();
        public virtual ICollection<Model> Models { get; set; } = new List<Model>();
    }
} 