using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Hubs;
using TradeFlowSystemAPI.Services;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IJwtService _jwtService;
        private readonly IActivityLogService _activityLogService;

        public PaymentsController(
            ApplicationDbContext context, 
            IHubContext<NotificationHub> hubContext,
            IJwtService jwtService,
            IActivityLogService activityLogService)
        {
            _context = context;
            _hubContext = hubContext;
            _jwtService = jwtService;
            _activityLogService = activityLogService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetPayments(
            [FromQuery] int? customerId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string? tur = null,
            [FromQuery] string? toptanci = null)
        {
            try
            {
                var query = _context.Payments.Include(p => p.Customer).AsQueryable();

                if (customerId.HasValue)
                    query = query.Where(p => p.CustomerId == customerId.Value);

                if (startDate.HasValue)
                    query = query.Where(p => p.Tarih >= startDate.Value);

                if (endDate.HasValue)
                    query = query.Where(p => p.Tarih <= endDate.Value);

                if (!string.IsNullOrEmpty(tur))
                    query = query.Where(p => p.Tur.ToLower().Contains(tur.ToLower()));

                if (!string.IsNullOrEmpty(toptanci))
                    query = query.Where(p => p.Toptanci != null && p.Toptanci.ToLower().Contains(toptanci.ToLower()));

                var payments = await query
                    .OrderByDescending(p => p.Tarih)
                    .ToListAsync();

                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ödemeler getirilirken hata oluştu: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPayment(int id)
        {
            try
            {
                var payment = await _context.Payments
                    .Include(p => p.Customer)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (payment == null)
                {
                    return NotFound("Ödeme bulunamadı");
                }

                return Ok(payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ödeme getirilirken hata oluştu: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Payment>> CreatePayment([FromBody] Payment payment)
        {
            try
            {
                // Müşteri kontrolü
                var customerExists = await _context.Customers.AnyAsync(c => c.Id == payment.CustomerId);
                if (!customerExists)
                {
                    return BadRequest("Geçersiz müşteri ID");
                }

                // Ekleyen kullanıcı bilgilerini al
                var currentUser = await _jwtService.GetCurrentUserAsync();
                if (currentUser == null) return Unauthorized("Geçersiz token");

                payment.CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                payment.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                payment.CreatedByUserId = currentUser.Id;
                payment.CreatedByUsername = currentUser.Username;

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                // İlgili müşteriyi al (bildirim ve log için ad-soyad kullanacağız)
                var customerForPayment = await _context.Customers.FindAsync(payment.CustomerId);

                // Activity log ekle
                await _activityLogService.LogActivityAsync(
                    "CREATE", 
                    "PAYMENT", 
                    payment.Id, 
                    $"{(customerForPayment?.AdSoyad ?? "Müşteri")} | {payment.Tutar}₺ - {payment.Tur}", 
                    $"Ödeme eklendi: {payment.Tutar}₺ (Müşteri: {(customerForPayment?.AdSoyad ?? payment.CustomerId.ToString())})", 
                    currentUser.Id, 
                    currentUser.Username
                );

                // Real-time bildirim gönder
                var paymentData = new
                {
                    payment.Id, payment.CustomerId, payment.Tutar, payment.Tarih, payment.Tur,
                    payment.Aciklama, payment.Toptanci, payment.CreatedAt, payment.UpdatedAt,
                    createdByUsername = currentUser.Username, // Include who created it
                    customerName = customerForPayment?.AdSoyad
                };
                await _hubContext.Clients.All.SendAsync("PaymentCreated", paymentData);

                return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ödeme oluşturulurken hata oluştu: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayment(int id, Payment payment)
        {
            try
            {
                if (id != payment.Id)
                {
                    return BadRequest("ID uyumsuzluğu");
                }

                var existingPayment = await _context.Payments.FindAsync(id);
                if (existingPayment == null)
                {
                    return NotFound("Ödeme bulunamadı");
                }

                // Müşteri kontrolü
                var customerExists = await _context.Customers.AnyAsync(c => c.Id == payment.CustomerId);
                if (!customerExists)
                {
                    return BadRequest("Geçersiz müşteri ID");
                }

                existingPayment.CustomerId = payment.CustomerId;
                existingPayment.Tutar = payment.Tutar;
                existingPayment.Tarih = DateTime.SpecifyKind(payment.Tarih.Date, DateTimeKind.Utc); // Sadece tarih kısmını al
                existingPayment.Tur = payment.Tur;
                existingPayment.Toptanci = payment.Toptanci;
                existingPayment.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);

                await _context.SaveChangesAsync();

                return Ok("Ödeme güncellendi");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ödeme güncellenirken hata oluştu: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            try
            {
                var payment = await _context.Payments.FindAsync(id);
                if (payment == null)
                {
                    return NotFound("Ödeme bulunamadı");
                }

                // Silen kullanıcı bilgilerini al
                var currentUser = await _jwtService.GetCurrentUserAsync();
                if (currentUser == null) return Unauthorized("Geçersiz token");

                // Silen kullanıcı bilgilerini kaydet
                payment.DeletedByUserId = currentUser.Id;
                payment.DeletedByUsername = currentUser.Username;

                // İlgili müşteriyi al (log ve event için)
                var customerForDeletedPayment = await _context.Customers.FindAsync(payment.CustomerId);

                // Activity log ekle
                await _activityLogService.LogActivityAsync(
                    "DELETE", 
                    "PAYMENT", 
                    payment.Id, 
                    $"{(customerForDeletedPayment?.AdSoyad ?? "Müşteri")} | {payment.Tutar}₺ - {payment.Tur}", 
                    $"Ödeme silindi: {payment.Tutar}₺ (Müşteri: {(customerForDeletedPayment?.AdSoyad ?? payment.CustomerId.ToString())})", 
                    currentUser.Id, 
                    currentUser.Username
                );

                _context.Payments.Remove(payment);
                await _context.SaveChangesAsync();

                // Real-time bildirim gönder
                var paymentData = new
                {
                    payment.Id, payment.CustomerId, payment.Tutar, payment.Tarih, payment.Tur,
                    payment.Aciklama, payment.Toptanci, payment.CreatedAt, payment.UpdatedAt,
                    deletedByUsername = currentUser.Username, // Include who deleted it
                    customerName = customerForDeletedPayment?.AdSoyad
                };
                await _hubContext.Clients.All.SendAsync("PaymentDeleted", paymentData);

                return Ok("Ödeme silindi");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ödeme silinirken hata oluştu: {ex.Message}");
            }
        }

        [HttpGet("customer/{customerId}/summary")]
        public async Task<ActionResult> GetCustomerPaymentSummary(int customerId)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(customerId);
                if (customer == null)
                {
                    return NotFound("Müşteri bulunamadı");
                }

                var payments = await _context.Payments
                    .Where(p => p.CustomerId == customerId)
                    .ToListAsync();

                var summary = new
                {
                    CustomerId = customerId,
                    CustomerName = customer.AdSoyad,
                    SozlesmeTutari = customer.SozlesmeTutari,
                    ToplamOdeme = payments.Sum(p => p.Tutar),
                    KalanBorc = customer.SozlesmeTutari - payments.Sum(p => p.Tutar),
                    OdemeAdedi = payments.Count,
                    SonOdemeTarihi = payments.Any() ? payments.Max(p => p.Tarih) : (DateTime?)null
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Özet getirilirken hata oluştu: {ex.Message}");
            }
        }
    }
}