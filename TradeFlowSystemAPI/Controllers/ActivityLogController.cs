using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Services;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Data;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActivityLogController : ControllerBase
    {
        private readonly IActivityLogService _activityLogService;
        private readonly ApplicationDbContext _context;

        public ActivityLogController(IActivityLogService activityLogService, ApplicationDbContext context)
        {
            _activityLogService = activityLogService;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetActivityLogs(
            [FromQuery] int? userId = null,
            [FromQuery] string? entityType = null,
            [FromQuery] string? action = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var activityLogs = await _activityLogService.GetActivityLogsAsync(userId, entityType, action, startDate, endDate);
                return Ok(new { success = true, data = activityLogs });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = $"İşlem hareketleri yüklenirken hata oluştu: {ex.Message}" });
            }
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentActivityLogs([FromQuery] int count = 50)
        {
            try
            {
                var activityLogs = await _activityLogService.GetActivityLogsAsync();
                var recentLogs = activityLogs.Take(count);
                return Ok(new { success = true, data = recentLogs });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = $"Son işlemler yüklenirken hata oluştu: {ex.Message}" });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetActivityUsers()
        {
            try
            {
                // Konsol loglarını kaldırdık

                var users = await _context.ActivityLogs
                    .Select(a => new { a.UserId, a.Username })
                    .Distinct()
                    .OrderBy(u => u.Username)
                    .ToListAsync();

                // Konsola yazma kaldırıldı

                return Ok(new { success = true, data = users });
            }
            catch (Exception ex)
            {
                // Sessiz hata (gerekirse logging altyapısına yönlendirilebilir)
                return StatusCode(500, new { success = false, error = $"Kullanıcı listesi yüklenirken hata oluştu: {ex.Message}" });
            }
        }

        [HttpGet("actions")]
        public async Task<IActionResult> GetActivityActions()
        {
            try
            {
                var actions = await _context.ActivityLogs
                    .Select(a => a.Action)
                    .Distinct()
                    .OrderBy(a => a)
                    .ToListAsync();

                return Ok(new { success = true, data = actions });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, error = $"İşlem türleri yüklenirken hata oluştu: {ex.Message}" });
            }
        }
    }
} 