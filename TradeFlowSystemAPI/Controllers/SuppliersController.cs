using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Services;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SuppliersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        public SuppliersController(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Supplier>>> GetSuppliers(
            [FromQuery] bool? isActive = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = _context.Suppliers.AsNoTracking().AsQueryable();

                if (isActive.HasValue)
                    query = query.Where(s => s.IsActive == isActive.Value);

                if (!string.IsNullOrEmpty(search))
                    query = query.Where(s => s.Name.ToLower().Contains(search.ToLower()));

                var suppliers = await query
                    .OrderBy(s => s.Name)
                    .ToListAsync();

                return Ok(suppliers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tedarikçiler getirilirken hata oluştu: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Supplier>> GetSupplier(int id)
        {
            try
            {
                var supplier = await _context.Suppliers.FindAsync(id);

                if (supplier == null)
                {
                    return NotFound("Tedarikçi bulunamadı");
                }

                return Ok(supplier);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tedarikçi getirilirken hata oluştu: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Supplier>> CreateSupplier(Supplier supplier)
        {
            try
            {
                // İsim kontrolü
                var existingSupplier = await _context.Suppliers
                    .FirstOrDefaultAsync(s => s.Name.ToLower() == supplier.Name.ToLower());
                
                if (existingSupplier != null)
                {
                    return BadRequest("Bu isimde bir tedarikçi zaten mevcut");
                }

                // Ekleyen kullanıcı bilgilerini al
                var currentUser = await _jwtService.GetCurrentUserAsync();
                if (currentUser == null) return Unauthorized("Geçersiz token");

                supplier.CreatedAt = DateTime.UtcNow;
                supplier.UpdatedAt = DateTime.UtcNow;
                supplier.CreatedByUserId = currentUser.Id;
                supplier.CreatedByUsername = currentUser.Username;

                _context.Suppliers.Add(supplier);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tedarikçi oluşturulurken hata oluştu: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, Supplier supplier)
        {
            try
            {
                if (id != supplier.Id)
                {
                    return BadRequest("ID uyumsuzluğu");
                }

                var existingSupplier = await _context.Suppliers.FindAsync(id);
                if (existingSupplier == null)
                {
                    return NotFound("Tedarikçi bulunamadı");
                }

                // İsim kontrolü (kendi dışında)
                var duplicateSupplier = await _context.Suppliers
                    .FirstOrDefaultAsync(s => s.Name.ToLower() == supplier.Name.ToLower() && s.Id != id);
                
                if (duplicateSupplier != null)
                {
                    return BadRequest("Bu isimde başka bir tedarikçi zaten mevcut");
                }

                existingSupplier.Name = supplier.Name;
                existingSupplier.Phone = supplier.Phone;
                existingSupplier.TaxNumber = supplier.TaxNumber;
                existingSupplier.IsActive = supplier.IsActive;
                existingSupplier.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok("Tedarikçi güncellendi");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tedarikçi güncellenirken hata oluştu: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            try
            {
                var supplier = await _context.Suppliers.FindAsync(id);
                if (supplier == null)
                {
                    return NotFound("Tedarikçi bulunamadı");
                }

                // Pasif yapma (soft delete)
                supplier.IsActive = false;
                supplier.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok("Tedarikçi pasif hale getirildi");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tedarikçi silinirken hata oluştu: {ex.Message}");
            }
        }

        [HttpPatch("{id}/activate")]
        public async Task<IActionResult> ActivateSupplier(int id)
        {
            try
            {
                var supplier = await _context.Suppliers.FindAsync(id);
                if (supplier == null)
                {
                    return NotFound("Tedarikçi bulunamadı");
                }

                supplier.IsActive = true;
                supplier.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok("Tedarikçi aktif hale getirildi");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Tedarikçi aktifleştirilirken hata oluştu: {ex.Message}");
            }
        }

        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<Supplier>>> GetActiveSuppliers()
        {
            try
            {
                var suppliers = await _context.Suppliers
                    .Where(s => s.IsActive)
                    .OrderBy(s => s.Name)
                    .AsNoTracking()
                    .ToListAsync();

                return Ok(suppliers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Aktif tedarikçiler getirilirken hata oluştu: {ex.Message}");
            }
        }


    }
}