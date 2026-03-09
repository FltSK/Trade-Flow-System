using System.ComponentModel.DataAnnotations;

namespace TradeFlowSystemAPI.DTOs
{
    public class UstaAssignmentDto
    {
        [Required]
        public int UstaId { get; set; }

        public string? Note { get; set; }
    }
}


