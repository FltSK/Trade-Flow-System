using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class BrandProductType
    {
        public int Id { get; set; }
        
        [Required]
        public int BrandId { get; set; }
        
        [Required]
        public int ProductTypeId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Brand Brand { get; set; } = null!;
        public virtual ProductType ProductType { get; set; } = null!;
    }
} 