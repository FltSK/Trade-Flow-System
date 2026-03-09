using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class CreateProductTypeDto
    {
        [Required]
        [StringLength(50)]
        public string Ad { get; set; } = string.Empty;
    }

    public class UpdateProductTypeDto
    {
        [Required]
        [StringLength(50)]
        public string Ad { get; set; } = string.Empty;
    }

    public class ProductTypeDto
    {
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 