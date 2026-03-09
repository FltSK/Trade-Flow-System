using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Services;
using BCrypt.Net;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        public AdminController(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        // Tüm kullanıcıları listele (SuperAdmin ve Admin için)
        [HttpGet("users")]
        public async Task<ActionResult<List<UserListDto>>> GetUsers()
        {
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader))
                {
                    return Unauthorized("Authorization header bulunamadı");
                }
                
                var token = authHeader.Split(" ").LastOrDefault();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized("Geçersiz token formatı");
                }
                
                var currentUser = _jwtService.GetUserFromToken(token);
                if (currentUser == null)
                {
                    return Unauthorized("Geçersiz token");
                }

                // Sadece SuperAdmin ve Admin kullanıcıları listeleyebilir (rolü normalize et)
                var requesterRole = (currentUser.Role ?? string.Empty).ToLowerInvariant();
                if (requesterRole != UserRoles.SuperAdmin && requesterRole != UserRoles.Admin)
                {
                    return Forbid();
                }

                var users = await _context.Users
                    .Select(u => new UserListDto
                    {
                        Id = u.Id,
                        Username = u.Username,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt,
                        UpdatedAt = u.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kullanıcılar listelenirken hata oluştu: {ex.Message}");
            }
        }

        // Admin ekle (Sadece SuperAdmin)
        [HttpPost("create-admin")]
        public async Task<ActionResult> CreateAdmin(CreateAdminDto createAdminDto)
        {
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader))
                {
                    return Unauthorized("Authorization header bulunamadı");
                }
                
                var token = authHeader.Split(" ").LastOrDefault();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized("Geçersiz token formatı");
                }
                
                var currentUser = _jwtService.GetUserFromToken(token);
                if (currentUser == null)
                {
                    return Unauthorized("Geçersiz token");
                }

                // Sadece SuperAdmin admin ekleyebilir (rolü normalize et)
                var requesterRole = (currentUser.Role ?? string.Empty).ToLowerInvariant();
                if (requesterRole != UserRoles.SuperAdmin)
                {
                    return Forbid();
                }

                // Kullanıcı adı kontrolü
                if (await _context.Users.AnyAsync(x => x.Username == createAdminDto.Username))
                {
                    return BadRequest("Bu kullanıcı adı zaten kullanımda");
                }

                // Şifre validasyonu
                if (createAdminDto.Password.Length < 6)
                {
                    return BadRequest("Şifre en az 6 karakter olmalıdır");
                }

                // Şifreyi hash'le
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(createAdminDto.Password);

                var admin = new User
                {
                    Username = createAdminDto.Username,
                    Email = createAdminDto.Email,
                    Password = hashedPassword,
                    Role = UserRoles.Admin,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(admin);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Admin başarıyla eklendi", username = admin.Username });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Admin eklenirken hata oluştu: {ex.Message}");
            }
        }

        // Çalışan ekle (SuperAdmin ve Admin)
        [HttpPost("create-employee")]
        public async Task<ActionResult> CreateEmployee(CreateEmployeeDto createEmployeeDto)
        {
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader))
                {
                    return Unauthorized("Authorization header bulunamadı");
                }
                
                var token = authHeader.Split(" ").LastOrDefault();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized("Geçersiz token formatı");
                }
                
                var currentUser = _jwtService.GetUserFromToken(token);
                if (currentUser == null)
                {
                    return Unauthorized("Geçersiz token");
                }

                // Sadece SuperAdmin ve Admin çalışan ekleyebilir (rolü normalize et)
                var requesterRole = (currentUser.Role ?? string.Empty).ToLowerInvariant();
                if (requesterRole != UserRoles.SuperAdmin && requesterRole != UserRoles.Admin)
                {
                    return Forbid();
                }

                // Kullanıcı adı kontrolü
                if (await _context.Users.AnyAsync(x => x.Username == createEmployeeDto.Username))
                {
                    return BadRequest("Bu kullanıcı adı zaten kullanımda");
                }

                // Şifre validasyonu
                if (createEmployeeDto.Password.Length < 6)
                {
                    return BadRequest("Şifre en az 6 karakter olmalıdır");
                }

                // Şifreyi hash'le
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(createEmployeeDto.Password);

                var employee = new User
                {
                    Username = createEmployeeDto.Username,
                    Email = createEmployeeDto.Email,
                    Password = hashedPassword,
                    Role = UserRoles.Employee,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(employee);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Çalışan başarıyla eklendi", username = employee.Username });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Çalışan eklenirken hata oluştu: {ex.Message}");
            }
        }

        // Kullanıcı sil (SuperAdmin ve Admin)
        [HttpDelete("users/{id}")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader))
                {
                    return Unauthorized("Authorization header bulunamadı");
                }
                
                var token = authHeader.Split(" ").LastOrDefault();
                if (string.IsNullOrEmpty(token))
                {
                    return Unauthorized("Geçersiz token formatı");
                }
                
                var currentUser = _jwtService.GetUserFromToken(token);
                if (currentUser == null)
                {
                    return Unauthorized("Geçersiz token");
                }

                // SuperAdmin ve Admin kullanıcı silebilir (rolü normalize et)
                var requesterRole = (currentUser.Role ?? string.Empty).ToLowerInvariant();
                if (requesterRole != UserRoles.SuperAdmin && requesterRole != UserRoles.Admin)
                {
                    return Forbid();
                }

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound("Kullanıcı bulunamadı");
                }

                // Kendini silmeye çalışıyorsa engelle
                if (user.Id == currentUser.Id)
                {
                    return BadRequest("Kendinizi silemezsiniz");
                }

                // Admin sadece çalışan silebilir; superadmin herkes için yetkilidir
                var targetRole = (user.Role ?? string.Empty).ToLowerInvariant();
                if (requesterRole == UserRoles.Admin && targetRole != UserRoles.Employee)
                {
                    return Forbid();
                }

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Kullanıcı başarıyla silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kullanıcı silinirken hata oluştu: {ex.Message}");
            }
        }
    }
}