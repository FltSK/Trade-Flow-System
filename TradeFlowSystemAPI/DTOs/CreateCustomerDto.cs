using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class CreateCustomerDto
    {
        [Required]
        [StringLength(100)]
        public string AdSoyad { get; set; } = string.Empty;

        [Required]
        [StringLength(11)]
        public string TcKimlik { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Telefon { get; set; }

        public string? Adres { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal SozlesmeTutari { get; set; }

        public DateTime? SozlesmeTarihi { get; set; }

        [Required]
        public DateTime OdemeTaahhutTarihi { get; set; }

        public DateTime? RandevuTarihi { get; set; }

        [StringLength(200)]
        public string? YapilanIs { get; set; }

        [StringLength(50)]
        public string? BoruTipi { get; set; }

        [StringLength(200)]
        public string? SatilanCihaz { get; set; }

        [StringLength(100)]
        public string? Termostat { get; set; }

        [StringLength(100)]
        public string? ToptanciIsmi { get; set; }

        [StringLength(100)]
        public string? UstaIsmi { get; set; }

        public bool? HesapYapildi { get; set; }

        public List<CreateCustomerSoldDeviceDto>? SoldDevices { get; set; }
    }
}