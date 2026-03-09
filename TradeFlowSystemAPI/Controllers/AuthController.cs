using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Services;
using BCrypt.Net;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthController(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<JwtResponseDto>> Login(LoginDto loginDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Username == loginDto.Username);

            if (user == null)
            {
                return BadRequest("Kullanıcı adı veya şifre hatalı");
            }

            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
            {
                return BadRequest("Kullanıcı adı veya şifre hatalı");
            }

            var token = _jwtService.GenerateToken(user);
            return Ok(token);
        }

        [HttpPost("register")]
        public async Task<ActionResult<JwtResponseDto>> Register(RegisterDto registerDto)
        {
            try
            {
                // Kullanıcı adı kontrolü
                if (await _context.Users.AnyAsync(x => x.Username == registerDto.Username))
                {
                    return BadRequest("Bu kullanıcı adı zaten kullanımda");
                }

                // Şifreyi hash'le
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

                var user = new User
                {
                    Username = registerDto.Username,
                    Password = hashedPassword,
                    Role = registerDto.Role,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var token = _jwtService.GenerateToken(user);
                return Ok(token);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Kayıt olunurken hata oluştu: {ex.Message}");
            }
        }

        [HttpGet("validate")]
        public IActionResult ValidateToken()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest("Token bulunamadı");
            }

            var isValid = _jwtService.ValidateToken(token);
            
            if (isValid)
            {
                return Ok("Token geçerli");
            }
            
            return Unauthorized("Token geçersiz");
        }

        [HttpPost("create-employee")]
        public async Task<ActionResult> CreateEmployee(CreateEmployeeDto createEmployeeDto)
        {
            try
            {
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

                // Şifrede kullanıcı adı kontrolü - isim kısmı şifre içinde olamaz
                var username = createEmployeeDto.Username.ToLower();
                var mekatekIndex = username.IndexOf("mekatek");
                if (mekatekIndex > 0)
                {
                    var namePart = username.Substring(0, mekatekIndex);
                    if (createEmployeeDto.Password.ToLower().Contains(namePart))
                    {
                        return BadRequest("Şifre çalışan adınızın isim kısmını içeremez");
                    }
                }

                // Şifreyi hash'le
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(createEmployeeDto.Password);

                var user = new User
                {
                    Username = createEmployeeDto.Username,
                    Password = hashedPassword,
                    Role = "employee", // Çalışan rolü
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Çalışan başarıyla eklendi", username = user.Username });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Çalışan eklenirken hata oluştu: {ex.Message}");
            }
        }

        [HttpPost("change-password")]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            try
            {
                // Token'dan kullanıcı bilgisini al
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Token bulunamadı");
                }

                var user = _jwtService.GetUserFromToken(token);
                if (user == null)
                {
                    return BadRequest("Geçersiz token");
                }

                // Veritabanından tam kullanıcı bilgisini al
                var fullUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
                if (fullUser == null)
                {
                    return BadRequest("Kullanıcı bulunamadı");
                }

                // Mevcut şifreyi kontrol et
                if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, fullUser.Password))
                {
                    return BadRequest("Mevcut şifre hatalı");
                }

                // Yeni şifre validasyonu
                if (changePasswordDto.NewPassword.Length < 6)
                {
                    return BadRequest("Şifre en az 6 karakter olmalıdır");
                }

                // Şifrede kullanıcı adı kontrolü - isim kısmı şifre içinde olamaz
                var username = fullUser.Username.ToLower();
                var mekatekIndex = username.IndexOf("mekatek");
                if (mekatekIndex > 0)
                {
                    var namePart = username.Substring(0, mekatekIndex);
                    if (changePasswordDto.NewPassword.ToLower().Contains(namePart))
                    {
                        return BadRequest("Şifre çalışan adınızın isim kısmını içeremez");
                    }
                }

                // Yeni şifreyi hash'le
                var hashedNewPassword = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);

                // Şifreyi güncelle
                fullUser.Password = hashedNewPassword;
                fullUser.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(fullUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Şifre başarıyla değiştirildi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Şifre değiştirilirken hata oluştu: {ex.Message}");
            }
        }

        [HttpPost("update-email")]
        public async Task<ActionResult> UpdateEmail(UpdateEmailDto updateEmailDto)
        {
            try
            {
                // Token'dan kullanıcı bilgisini al
                var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest("Token bulunamadı");
                }

                var user = _jwtService.GetUserFromToken(token);
                if (user == null)
                {
                    return BadRequest("Geçersiz token");
                }

                // Veritabanından tam kullanıcı bilgisini al
                var fullUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
                if (fullUser == null)
                {
                    return BadRequest("Kullanıcı bulunamadı");
                }

                // Email validasyonu
                if (string.IsNullOrEmpty(updateEmailDto.Email))
                {
                    return BadRequest("Email adresi boş olamaz");
                }

                // Email formatı kontrolü
                var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$");
                if (!emailRegex.IsMatch(updateEmailDto.Email))
                {
                    return BadRequest("Geçerli bir email adresi giriniz");
                }

                // Email'i güncelle
                fullUser.Email = updateEmailDto.Email;
                fullUser.UpdatedAt = DateTime.UtcNow;

                _context.Users.Update(fullUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Email başarıyla güncellendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Email güncellenirken hata oluştu: {ex.Message}");
            }
        }
    }
}