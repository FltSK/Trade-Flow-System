using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TradeFlowSystemAPI.Services;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SessionController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        public SessionController(ISessionService sessionService)
        {
            _sessionService = sessionService;
        }

        [HttpGet("user-sessions")]
        public async Task<IActionResult> GetUserSessions()
        {
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            if (userId == 0) return Unauthorized();

            var sessions = await _sessionService.GetUserSessionsAsync(userId);
            return Ok(sessions);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            await _sessionService.DeactivateSessionAsync(token);
            return Ok(new { message = "Başarıyla çıkış yapıldı" });
        }

        [HttpPost("logout-all")]
        public async Task<IActionResult> LogoutAll()
        {
            var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            if (userId == 0) return Unauthorized();

            await _sessionService.DeactivateAllUserSessionsAsync(userId);
            return Ok(new { message = "Tüm oturumlar sonlandırıldı" });
        }

        [HttpPost("cleanup")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CleanupExpiredSessions()
        {
            await _sessionService.CleanupExpiredSessionsAsync();
            return Ok(new { message = "Süresi dolmuş oturumlar temizlendi" });
        }
    }
} 