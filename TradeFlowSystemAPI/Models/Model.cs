using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class Model
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Ad { get; set; } = string.Empty;
        
        [Required]
        public int BrandId { get; set; }
        
        [Required]
        public int ProductTypeId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        public virtual Brand Brand { get; set; } = null!;
        public virtual ProductType ProductType { get; set; } = null!;
    }
} 