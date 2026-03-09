using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;
using TradeFlowSystemAPI.Services;
using System.Security.Claims;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ModelsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IActivityLogService _activityLogService;

        public ModelsController(ApplicationDbContext context, IActivityLogService activityLogService)
        {
            _context = context;
            _activityLogService = activityLogService;
        }

        // GET: api/Models
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ModelDto>>> GetModels([FromQuery] bool? onlyActive = null)
        {
            var query = _context.Models
                .Include(m => m.Brand)
                .Include(m => m.ProductType)
                .AsQueryable();

            if (onlyActive.HasValue && onlyActive.Value)
            {
                query = query.Where(m => m.IsActive);
            }

            var models = await query
                    .OrderBy(m => m.Brand.Ad)
                    .ThenBy(m => m.ProductType.Ad)
                    .ThenBy(m => m.Ad)
                    .Select(m => new ModelDto
                    {
                        Id = m.Id,
                        Ad = m.Ad,
                        BrandId = m.BrandId,
                        BrandAd = m.Brand.Ad,
                        ProductTypeId = m.ProductTypeId,
                        ProductTypeAd = m.ProductType.Ad,
                        CreatedAt = m.CreatedAt,
                        UpdatedAt = m.UpdatedAt,
                        IsActive = m.IsActive
                    })
                    .ToListAsync();

            return Ok(models);
        }

        // GET: api/Models/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ModelDto>> GetModel(int id)
        {
            var model = await _context.Models
                .Include(m => m.Brand)
                .Include(m => m.ProductType)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (model == null)
            {
                return NotFound();
            }

            var modelDto = new ModelDto
            {
                Id = model.Id,
                Ad = model.Ad,
                BrandId = model.BrandId,
                BrandAd = model.Brand.Ad,
                ProductTypeId = model.ProductTypeId,
                ProductTypeAd = model.ProductType.Ad,
                CreatedAt = model.CreatedAt,
                UpdatedAt = model.UpdatedAt,
                IsActive = model.IsActive
            };

            return Ok(modelDto);
        }

        // GET: api/Models/Brand/5
        [HttpGet("Brand/{brandId}")]
        public async Task<ActionResult<IEnumerable<ModelDto>>> GetModelsByBrand(int brandId, [FromQuery] bool? onlyActive = null)
        {
            var query = _context.Models
                .Include(m => m.Brand)
                .Include(m => m.ProductType)
                .Where(m => m.BrandId == brandId)
                .AsQueryable();

            if (onlyActive.HasValue && onlyActive.Value)
            {
                query = query.Where(m => m.IsActive);
            }

            var models = await query
                .OrderBy(m => m.ProductType.Ad)
                .ThenBy(m => m.Ad)
                .Select(m => new ModelDto
                {
                    Id = m.Id,
                    Ad = m.Ad,
                    BrandId = m.BrandId,
                    BrandAd = m.Brand.Ad,
                    ProductTypeId = m.ProductTypeId,
                    ProductTypeAd = m.ProductType.Ad,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    IsActive = m.IsActive
                })
                .ToListAsync();

            return Ok(models);
        }

        // GET: api/Models/Brand/5/ProductType/3
        [HttpGet("Brand/{brandId}/ProductType/{productTypeId}")]
        public async Task<ActionResult<IEnumerable<ModelDto>>> GetModelsByBrandAndProductType(int brandId, int productTypeId, [FromQuery] bool? onlyActive = null)
        {
            var query = _context.Models
                .Include(m => m.Brand)
                .Include(m => m.ProductType)
                .Where(m => m.BrandId == brandId && m.ProductTypeId == productTypeId)
                .AsQueryable();

            if (onlyActive.HasValue && onlyActive.Value)
            {
                query = query.Where(m => m.IsActive);
            }

            var models = await query
                .OrderBy(m => m.Ad)
                .Select(m => new ModelDto
                {
                    Id = m.Id,
                    Ad = m.Ad,
                    BrandId = m.BrandId,
                    BrandAd = m.Brand.Ad,
                    ProductTypeId = m.ProductTypeId,
                    ProductTypeAd = m.ProductType.Ad,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    IsActive = m.IsActive
                })
                .ToListAsync();

            return Ok(models);
        }

        // GET: api/Models/ProductType/3
        [HttpGet("ProductType/{productTypeId}")]
        public async Task<ActionResult<IEnumerable<ModelDto>>> GetModelsByProductType(int productTypeId, [FromQuery] bool? onlyActive = null)
        {
            var query = _context.Models
                .Include(m => m.Brand)
                .Include(m => m.ProductType)
                .Where(m => m.ProductTypeId == productTypeId)
                .AsQueryable();

            if (onlyActive.HasValue && onlyActive.Value)
            {
                query = query.Where(m => m.IsActive);
            }

            var models = await query
                .OrderBy(m => m.Brand.Ad)
                .ThenBy(m => m.Ad)
                .Select(m => new ModelDto
                {
                    Id = m.Id,
                    Ad = m.Ad,
                    BrandId = m.BrandId,
                    BrandAd = m.Brand.Ad,
                    ProductTypeId = m.ProductTypeId,
                    ProductTypeAd = m.ProductType.Ad,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    IsActive = m.IsActive
                })
                .ToListAsync();

            return Ok(models);
        }

        // POST: api/Models
        [HttpPost]
        public async Task<ActionResult<ModelDto>> CreateModel(CreateModelDto dto)
        {
            // Check if brand exists
            var brand = await _context.Brands.FindAsync(dto.BrandId);
            if (brand == null)
            {
                return BadRequest("Marka bulunamadı.");
            }

            // Check if product type exists
            var productType = await _context.ProductTypes.FindAsync(dto.ProductTypeId);
            if (productType == null)
            {
                return BadRequest("Ürün türü bulunamadı.");
            }

            // Check if brand-product type relationship exists
            var brandProductType = await _context.BrandProductTypes
                .FirstOrDefaultAsync(bpt => bpt.BrandId == dto.BrandId && bpt.ProductTypeId == dto.ProductTypeId);
            if (brandProductType == null)
            {
                return BadRequest("Bu marka-ürün türü ilişkisi mevcut değil.");
            }

            // Check if model with same name already exists for this brand and product type
            if (await _context.Models.AnyAsync(m => m.BrandId == dto.BrandId && m.ProductTypeId == dto.ProductTypeId && m.Ad.ToLower() == dto.Ad.ToLower()))
            {
                return BadRequest("Bu model zaten mevcut.");
            }

            var model = new Model
            {
                Ad = dto.Ad,
                BrandId = dto.BrandId,
                ProductTypeId = dto.ProductTypeId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Models.Add(model);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Create",
                    "Model",
                    model.Id,
                    $"{brand.Ad} {model.Ad} ({productType.Ad})",
                    $"Yeni model oluşturuldu: {brand.Ad} {model.Ad} ({productType.Ad})",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            var modelDto = new ModelDto
            {
                Id = model.Id,
                Ad = model.Ad,
                BrandId = model.BrandId,
                BrandAd = brand.Ad,
                ProductTypeId = model.ProductTypeId,
                ProductTypeAd = productType.Ad,
                CreatedAt = model.CreatedAt,
                UpdatedAt = model.UpdatedAt
            };

            return CreatedAtAction(nameof(GetModel), new { id = model.Id }, modelDto);
        }

        // PUT: api/Models/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateModel(int id, UpdateModelDto dto)
        {
            var model = await _context.Models.FindAsync(id);

            if (model == null)
            {
                return NotFound();
            }

            // Check if brand exists
            var brand = await _context.Brands.FindAsync(dto.BrandId);
            if (brand == null)
            {
                return BadRequest("Marka bulunamadı.");
            }

            // Check if product type exists
            var productType = await _context.ProductTypes.FindAsync(dto.ProductTypeId);
            if (productType == null)
            {
                return BadRequest("Ürün türü bulunamadı.");
            }

            // Check if brand-product type relationship exists
            var brandProductType = await _context.BrandProductTypes
                .FirstOrDefaultAsync(bpt => bpt.BrandId == dto.BrandId && bpt.ProductTypeId == dto.ProductTypeId);
            if (brandProductType == null)
            {
                return BadRequest("Bu marka-ürün türü ilişkisi mevcut değil.");
            }

            // Check if model with same name already exists for this brand and product type (excluding current one)
            if (await _context.Models.AnyAsync(m => m.BrandId == dto.BrandId && m.ProductTypeId == dto.ProductTypeId && m.Ad.ToLower() == dto.Ad.ToLower() && m.Id != id))
            {
                return BadRequest("Bu model zaten mevcut.");
            }

            var oldBrand = await _context.Brands.FindAsync(model.BrandId);
            var oldProductType = await _context.ProductTypes.FindAsync(model.ProductTypeId);
            var oldName = $"{oldBrand?.Ad} {model.Ad} ({oldProductType?.Ad})";

            model.Ad = dto.Ad;
            model.BrandId = dto.BrandId;
            model.ProductTypeId = dto.ProductTypeId;
            model.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                var newName = $"{brand.Ad} {model.Ad} ({productType.Ad})";
                await _activityLogService.LogActivityAsync(
                    "Update",
                    "Model",
                    model.Id,
                    newName,
                    $"Model güncellendi: {oldName} → {newName}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }

        // POST: api/Models/{id}/deactivate
        [HttpPost("{id}/deactivate")]
        public async Task<IActionResult> DeactivateModel(int id)
        {
            var model = await _context.Models.FindAsync(id);
            if (model == null) return NotFound();
            model.IsActive = false;
            model.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // POST: api/Models/{id}/activate
        [HttpPost("{id}/activate")]
        public async Task<IActionResult> ActivateModel(int id)
        {
            var model = await _context.Models.FindAsync(id);
            if (model == null) return NotFound();
            model.IsActive = true;
            model.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // DELETE: api/Models/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteModel(int id)
        {
            var model = await _context.Models
                .Include(m => m.Brand)
                .Include(m => m.ProductType)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (model == null)
            {
                return NotFound();
            }

            // Check if model is being used by any stock items
            var hasStockItems = await _context.Stoklar.AnyAsync(s => s.Marka == model.Brand.Ad && s.Model == model.Ad);
            if (hasStockItems)
            {
                return BadRequest("Bu model stok kayıtlarında kullanımda olduğu için silinemez.");
            }

            var modelName = $"{model.Brand.Ad} {model.Ad} ({model.ProductType.Ad})";
            _context.Models.Remove(model);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Delete",
                    "Model",
                    id,
                    modelName,
                    $"Model silindi: {modelName}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }
    }
} 