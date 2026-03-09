using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TradeFlowSystemAPI.Services;
using System.Security.Claims;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DeleteRequestController : ControllerBase
    {
        private readonly IDeleteRequestService _deleteRequestService;

        public DeleteRequestController(IDeleteRequestService deleteRequestService)
        {
            _deleteRequestService = deleteRequestService;
        }

        [HttpGet("pending")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _deleteRequestService.GetPendingRequestsAsync();
            return Ok(requests);
        }

        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0) return Unauthorized();

            var requests = await _deleteRequestService.GetUserRequestsAsync(userId);
            return Ok(requests);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequest(int id)
        {
            var request = await _deleteRequestService.GetDeleteRequestAsync(id);
            if (request == null) return NotFound();

            return Ok(request);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateDeleteRequestDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            if (userId == 0) 
            {
                return Unauthorized();
            }
            
            try
            {
                var request = await _deleteRequestService.CreateDeleteRequestAsync(
                    dto.CustomerId, 
                    dto.PaymentId, 
                    userId, 
                    dto.Reason
                );
                
                return CreatedAtAction(nameof(GetRequest), new { id = request.Id }, request);
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPost("{id}/approve")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ApproveRequest(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            if (userId == 0) 
            {
                return Unauthorized();
            }
            
            try
            {
                var success = await _deleteRequestService.ApproveRequestAsync(id, userId);
                
                if (!success) 
                {
                    return BadRequest("İstek onaylanamadı");
                }

                return Ok(new { message = "İstek onaylandı" });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpPost("{id}/reject")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RejectRequest(int id, [FromBody] RejectRequestDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            if (userId == 0) 
            {
                return Unauthorized();
            }
            
            try
            {
                var success = await _deleteRequestService.RejectRequestAsync(id, userId, dto.Reason);
                
                if (!success) 
                {
                    return BadRequest("İstek reddedilemedi");
                }

                return Ok(new { message = "İstek reddedildi" });
            }
            catch (Exception)
            {
                throw;
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRequest(int id)
        {
            var success = await _deleteRequestService.DeleteRequestAsync(id);
            if (!success) return NotFound();

            return Ok(new { message = "İstek silindi" });
        }
    }

    public class CreateDeleteRequestDto
    {
        public int CustomerId { get; set; }
        public int? PaymentId { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class RejectRequestDto
    {
        public string Reason { get; set; } = string.Empty;
    }
} 