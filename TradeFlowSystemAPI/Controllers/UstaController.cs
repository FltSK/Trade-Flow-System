using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Services;
using System.Security.Claims;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UstaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IActivityLogService _activityLogService;
        private readonly IJwtService _jwtService;

        public UstaController(ApplicationDbContext context, IActivityLogService activityLogService, IJwtService jwtService)
        {
            _context = context;
            _activityLogService = activityLogService;
            _jwtService = jwtService;
        }

        // GET: api/usta
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Usta>>> GetUstalar()
        {
            return await _context.Ustalar
                .OrderBy(u => u.AdSoyad)
                .ToListAsync();
        }

        // GET: api/usta/active
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<object>>> GetActiveUstalar()
        {
            var list = await _context.Ustalar
                .Where(u => u.IsActive)
                .Select(u => new { u.Id, u.AdSoyad, u.UzmanlikAlani })
                .OrderBy(u => u.AdSoyad)
                .ToListAsync();
            return Ok(list);
        }

        // GET: api/usta/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Usta>> GetUsta(int id)
        {
            var usta = await _context.Ustalar.FindAsync(id);

            if (usta == null)
            {
                return NotFound();
            }

            return usta;
        }

        // POST: api/usta
        [HttpPost]
        public async Task<ActionResult<Usta>> CreateUsta(Usta usta)
        {
            int userId = 0; string username = string.Empty;
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeader))
                {
                    var token = authHeader.Split(' ').LastOrDefault();
                    var currentUser = _jwtService.GetUserFromToken(token!);
                    if (currentUser != null)
                    {
                        userId = currentUser.Id;
                        username = currentUser.Username;
                    }
                }
            }
            catch { /* ignore */ }
            if (userId == 0)
            {
                // Varsayılanları bul: önce admin, yoksa herhangi bir kullanıcı, en sonda 1/system
                var fallback = await _context.Users
                    .OrderBy(u => u.Id)
                    .Select(u => new { u.Id, u.Username, u.Role })
                    .ToListAsync();
                var admin = fallback.FirstOrDefault(u => u.Role == "admin");
                if (admin != null) { userId = admin.Id; username = admin.Username; }
                else if (fallback.Count > 0) { userId = fallback[0].Id; username = fallback[0].Username; }
                else { userId = 1; if (string.IsNullOrEmpty(username)) username = "system"; }
            }

            usta.CreatedByUserId = userId;
            usta.CreatedByUsername = username;
            usta.CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            usta.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            _context.Ustalar.Add(usta);
            await _context.SaveChangesAsync();

            // Activity log
            await _activityLogService.LogActivityAsync(
                "CREATE",
                "Usta",
                usta.Id,
                usta.AdSoyad,
                $"Usta eklendi: {usta.AdSoyad}",
                userId,
                username
            );

            return CreatedAtAction(nameof(GetUsta), new { id = usta.Id }, usta);
        }

        // PUT: api/usta/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUsta(int id, Usta usta)
        {
            var existingUsta = await _context.Ustalar.FindAsync(id);
            if (existingUsta == null)
            {
                return NotFound();
            }

            int userId = 0; string username = string.Empty;
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (!string.IsNullOrEmpty(authHeader))
                {
                    var token = authHeader.Split(' ').LastOrDefault();
                    var currentUser = _jwtService.GetUserFromToken(token!);
                    if (currentUser != null)
                    {
                        userId = currentUser.Id;
                        username = currentUser.Username;
                    }
                }
            }
            catch { }
            if (userId == 0)
            {
                var fallback = await _context.Users
                    .OrderBy(u => u.Id)
                    .Select(u => new { u.Id, u.Username, u.Role })
                    .ToListAsync();
                var admin = fallback.FirstOrDefault(u => u.Role == "admin");
                if (admin != null) { userId = admin.Id; username = admin.Username; }
                else if (fallback.Count > 0) { userId = fallback[0].Id; username = fallback[0].Username; }
                else if (existingUsta.CreatedByUserId > 0) { userId = existingUsta.CreatedByUserId; username = existingUsta.CreatedByUsername ?? username; }
                else { userId = 1; if (string.IsNullOrEmpty(username)) username = "system"; }
            }

            existingUsta.AdSoyad = usta.AdSoyad;
            existingUsta.Telefon = usta.Telefon;
            existingUsta.Adres = usta.Adres;
            existingUsta.Email = usta.Email;
            existingUsta.UzmanlikAlani = usta.UzmanlikAlani;
            existingUsta.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            try
            {
                await _context.SaveChangesAsync();

                // Activity log
                await _activityLogService.LogActivityAsync(
                    "UPDATE",
                    "Usta",
                    existingUsta.Id,
                    existingUsta.AdSoyad,
                    $"Usta güncellendi: {existingUsta.AdSoyad}",
                    userId,
                    username
                );
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UstaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/usta/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsta(int id)
        {
            var usta = await _context.Ustalar.FindAsync(id);
            if (usta == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "";

            usta.IsActive = false;
            usta.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            // Activity log
            await _activityLogService.LogActivityAsync(
                "DELETE",
                "Usta",
                usta.Id,
                usta.AdSoyad,
                $"Usta silindi: {usta.AdSoyad}",
                userId,
                username
            );

            return NoContent();
        }

        // DELETE: api/usta/{id}/permanent (Hard Delete - Kalıcı Sil)
        [HttpDelete("{id}/permanent")]
        public async Task<IActionResult> DeleteUstaPermanent(int id)
        {
            var usta = await _context.Ustalar.FindAsync(id);
            if (usta == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "";

            // Usta bu müşterilere atanmış mı kontrol et
            var hasAssignedCustomers = await _context.Customers.AnyAsync(c => c.UstaIsmi == usta.AdSoyad);
            if (hasAssignedCustomers)
            {
                return BadRequest("Bu usta müşterilere atanmış durumda. Önce müşterilerden usta atamasını kaldırın.");
            }

            _context.Ustalar.Remove(usta);
            await _context.SaveChangesAsync();

            // Activity log
            await _activityLogService.LogActivityAsync(
                "DELETE_PERMANENT",
                "Usta",
                usta.Id,
                usta.AdSoyad,
                $"Usta kalıcı olarak silindi: {usta.AdSoyad}",
                userId,
                username
            );

            return NoContent();
        }

        // POST: api/usta/{id}/activate
        [HttpPost("{id}/activate")]
        public async Task<IActionResult> ActivateUsta(int id)
        {
            var usta = await _context.Ustalar.FindAsync(id);
            if (usta == null)
            {
                return NotFound();
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "";

            usta.IsActive = true;
            usta.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

            await _context.SaveChangesAsync();

            // Activity log
            await _activityLogService.LogActivityAsync(
                "ACTIVATE",
                "Usta",
                usta.Id,
                usta.AdSoyad,
                $"Usta aktifleştirildi: {usta.AdSoyad}",
                userId,
                username
            );

            return NoContent();
        }

        private bool UstaExists(int id)
        {
            return _context.Ustalar.Any(e => e.Id == id);
        }
    }
} 