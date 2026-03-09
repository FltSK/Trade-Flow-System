using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class ActivityLog
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Action { get; set; } = string.Empty; // CREATE, UPDATE, DELETE, APPROVE, REJECT
        
        [Required]
        [StringLength(50)]
        public string EntityType { get; set; } = string.Empty; // CUSTOMER, PAYMENT, SUPPLIER, DELETE_REQUEST
        
        public int? EntityId { get; set; }
        
        [StringLength(200)]
        public string? EntityName { get; set; } // Müşteri adı, ödeme tutarı vb.
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [Required]
        public int UserId { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Username { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation property
        public virtual User? User { get; set; }
    }
} 