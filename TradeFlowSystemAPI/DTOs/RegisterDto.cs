using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Kullanıcı adı gerekli")]
        [StringLength(50, ErrorMessage = "Kullanıcı adı en fazla 50 karakter olabilir")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre gerekli")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6, en fazla 100 karakter olmalı")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rol gerekli")]
        [RegularExpression("^(admin|user)$", ErrorMessage = "Rol sadece 'admin' veya 'user' olabilir")]
        public string Role { get; set; } = "user";
    }
}