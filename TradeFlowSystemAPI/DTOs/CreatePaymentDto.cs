using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class CreatePaymentDto
    {
        [Required(ErrorMessage = "Müşteri ID gerekli")]
        public int CustomerId { get; set; }
        
        [Required(ErrorMessage = "Tutar gerekli")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar 0'dan büyük olmalı")]
        public decimal Tutar { get; set; }
        
        [Required(ErrorMessage = "Tarih gerekli")]
        public DateTime Tarih { get; set; }
        
        [Required(ErrorMessage = "Ödeme türü gerekli")]
        [StringLength(50, ErrorMessage = "Ödeme türü en fazla 50 karakter olabilir")]
        public string Tur { get; set; } = string.Empty;
        
        [StringLength(100, ErrorMessage = "Toptancı adı en fazla 100 karakter olabilir")]
        public string? Toptanci { get; set; }
    }
}