using Microsoft.AspNetCore.Http;

namespace TradeFlowSystemAPI.Models
{
    public class UploadSozlesmeRequest
    {
        public IFormFile File { get; set; } = default!;
    }
}
