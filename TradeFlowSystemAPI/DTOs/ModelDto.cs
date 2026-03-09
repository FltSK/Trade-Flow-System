using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class CreateModelDto
    {
        [Required]
        [StringLength(100)]
        public string Ad { get; set; } = string.Empty;
        
        [Required]
        public int BrandId { get; set; }
        
        [Required]
        public int ProductTypeId { get; set; }
    }

    public class UpdateModelDto
    {
        [Required]
        [StringLength(100)]
        public string Ad { get; set; } = string.Empty;
        
        [Required]
        public int BrandId { get; set; }
        
        [Required]
        public int ProductTypeId { get; set; }
    }

    public class ModelDto
    {
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public int BrandId { get; set; }
        public string BrandAd { get; set; } = string.Empty;
        public int ProductTypeId { get; set; }
        public string ProductTypeAd { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; }
    }
} 