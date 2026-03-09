using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class UpdateEmailDto
    {
        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;
    }
} 