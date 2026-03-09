using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class UserSession
    {
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Token { get; set; } = string.Empty;
        
        [Required]
        public DateTime ExpiresAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        
        [StringLength(200)]
        public string? DeviceInfo { get; set; }
        
        [StringLength(50)]
        public string? IpAddress { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public virtual User User { get; set; } = null!;
    }
} 