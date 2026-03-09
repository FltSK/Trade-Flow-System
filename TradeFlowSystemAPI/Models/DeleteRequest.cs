using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class DeleteRequest
    {
        public int Id { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        public int? PaymentId { get; set; } // null ise müşteri silme
        
        [Required]
        public int RequestedByUserId { get; set; }
        
        public int? ApprovedByUserId { get; set; }
        
        [Required]
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ApprovedAt { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected"
        
        [StringLength(500)]
        public string? Reason { get; set; }
        
        [StringLength(500)]
        public string? RejectionReason { get; set; }
        
        // Navigation properties
        public virtual Customer Customer { get; set; } = null!;
        public virtual Payment? Payment { get; set; }
        public virtual User RequestedBy { get; set; } = null!;
        public virtual User? ApprovedBy { get; set; }
    }
} 