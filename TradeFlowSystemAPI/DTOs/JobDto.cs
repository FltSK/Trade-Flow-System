namespace TradeFlowSystemAPI.DTOs
{
    public class JobDto
    {
        public int Id { get; set; }
        public string Ad { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<ProductTypeDto> ProductTypes { get; set; } = new();
    }

    public class CreateJobDto
    {
        public string Ad { get; set; } = string.Empty;
    }

    public class UpdateJobDto
    {
        public string Ad { get; set; } = string.Empty;
    }
}


