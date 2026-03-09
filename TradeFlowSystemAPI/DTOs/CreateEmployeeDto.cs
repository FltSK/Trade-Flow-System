using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class CreateEmployeeDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalıdır")]
        public string Password { get; set; } = string.Empty;
    }
} 