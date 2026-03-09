using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class CreateBrandDto
    {
        [Required]
        [StringLength(100)]
        public string Ad { get; set; } = string.Empty;
    }

    public class UpdateBrandDto
    {
        [Required]
        [StringLength(100)]
        public string Ad { get; set; } = string.Empty;
    }

    public class BrandDto
    {
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 