namespace TradeFlowSystemAPI.Models
{
    public class JobProductType
    {
        public int Id { get; set; }
        public int JobId { get; set; }
        public int ProductTypeId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual Job Job { get; set; } = null!;
        public virtual ProductType ProductType { get; set; } = null!;
    }
}


