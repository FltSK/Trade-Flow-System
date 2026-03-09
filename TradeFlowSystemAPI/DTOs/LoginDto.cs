using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Kullanıcı adı gerekli")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre gerekli")]
        public string Password { get; set; } = string.Empty;
    }
}