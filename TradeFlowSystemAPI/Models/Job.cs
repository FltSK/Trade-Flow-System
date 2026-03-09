using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.Models
{
    public class Job
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Ad { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public virtual ICollection<JobProductType> JobProductTypes { get; set; } = new List<JobProductType>();
    }
}


