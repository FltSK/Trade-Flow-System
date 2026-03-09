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
    public class BrandsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IActivityLogService _activityLogService;

        public BrandsController(ApplicationDbContext context, IActivityLogService activityLogService)
        {
            _context = context;
            _activityLogService = activityLogService;
        }

        // GET: api/Brands
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BrandDto>>> GetBrands()
        {
            var brands = await _context.Brands
                .OrderBy(b => b.Ad)
                .Select(b => new BrandDto
                {
                    Id = b.Id,
                    Ad = b.Ad,
                    CreatedAt = b.CreatedAt,
                    UpdatedAt = b.UpdatedAt
                })
                .ToListAsync();

            return Ok(brands);
        }

        // GET: api/Brands/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BrandDto>> GetBrand(int id)
        {
            var brand = await _context.Brands.FindAsync(id);

            if (brand == null)
            {
                return NotFound();
            }

            var brandDto = new BrandDto
            {
                Id = brand.Id,
                Ad = brand.Ad,
                CreatedAt = brand.CreatedAt,
                UpdatedAt = brand.UpdatedAt
            };

            return Ok(brandDto);
        }

        // GET: api/Brands/5/ProductTypes
        [HttpGet("{id}/ProductTypes")]
        public async Task<ActionResult<IEnumerable<object>>> GetBrandProductTypes(int id)
        {
            var brand = await _context.Brands.FindAsync(id);

            if (brand == null)
            {
                return NotFound();
            }

            var brandProductTypes = await _context.BrandProductTypes
                .Where(bpt => bpt.BrandId == id)
                .Include(bpt => bpt.ProductType)
                .Select(bpt => new
                {
                    Id = bpt.Id,
                    BrandId = bpt.BrandId,
                    ProductTypeId = bpt.ProductTypeId,
                    ProductType = new ProductTypeDto
                    {
                        Id = bpt.ProductType.Id,
                        Ad = bpt.ProductType.Ad,
                        CreatedAt = bpt.ProductType.CreatedAt,
                        UpdatedAt = bpt.ProductType.UpdatedAt
                    },
                    CreatedAt = bpt.CreatedAt
                })
                .ToListAsync();

            return Ok(brandProductTypes);
        }

        // GET: api/Brands/ProductType/5
        [HttpGet("ProductType/{productTypeId}")]
        public async Task<ActionResult<IEnumerable<BrandDto>>> GetBrandsByProductType(int productTypeId)
        {
            // Check if product type exists
            var productType = await _context.ProductTypes.FindAsync(productTypeId);
            if (productType == null)
            {
                return NotFound("Ürün türü bulunamadı.");
            }

            var brands = await _context.BrandProductTypes
                .Where(bpt => bpt.ProductTypeId == productTypeId)
                .Include(bpt => bpt.Brand)
                .Select(bpt => new BrandDto
                {
                    Id = bpt.Brand.Id,
                    Ad = bpt.Brand.Ad,
                    CreatedAt = bpt.Brand.CreatedAt,
                    UpdatedAt = bpt.Brand.UpdatedAt
                })
                .OrderBy(b => b.Ad)
                .ToListAsync();

            return Ok(brands);
        }

        // POST: api/Brands
        [HttpPost]
        public async Task<ActionResult<BrandDto>> CreateBrand(CreateBrandDto dto)
        {
            // Check if brand with same name already exists
            if (await _context.Brands.AnyAsync(b => b.Ad.ToLower() == dto.Ad.ToLower()))
            {
                return BadRequest("Bu marka zaten mevcut.");
            }

            var brand = new Brand
            {
                Ad = dto.Ad,
                CreatedAt = DateTime.UtcNow
            };

            _context.Brands.Add(brand);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Create",
                    "Brand",
                    brand.Id,
                    brand.Ad,
                    $"Yeni marka oluşturuldu: {brand.Ad}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            var brandDto = new BrandDto
            {
                Id = brand.Id,
                Ad = brand.Ad,
                CreatedAt = brand.CreatedAt,
                UpdatedAt = brand.UpdatedAt
            };

            return CreatedAtAction(nameof(GetBrand), new { id = brand.Id }, brandDto);
        }

        // PUT: api/Brands/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBrand(int id, UpdateBrandDto dto)
        {
            var brand = await _context.Brands.FindAsync(id);

            if (brand == null)
            {
                return NotFound();
            }

            // Check if brand with same name already exists (excluding current one)
            if (await _context.Brands.AnyAsync(b => b.Ad.ToLower() == dto.Ad.ToLower() && b.Id != id))
            {
                return BadRequest("Bu marka zaten mevcut.");
            }

            var oldName = brand.Ad;
            brand.Ad = dto.Ad;
            brand.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Update",
                    "Brand",
                    brand.Id,
                    brand.Ad,
                    $"Marka güncellendi: {oldName} → {brand.Ad}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }

        // DELETE: api/Brands/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBrand(int id)
        {
            var brand = await _context.Brands.FindAsync(id);

            if (brand == null)
            {
                return NotFound();
            }

            // Check if brand is being used by any models
            var hasModels = await _context.Models.AnyAsync(m => m.BrandId == id);
            if (hasModels)
            {
                return BadRequest("Bu marka kullanımda olduğu için silinemez.");
            }

            var brandName = brand.Ad;

            // First, remove all brand-product type relationships
            var brandProductTypes = await _context.BrandProductTypes
                .Where(bpt => bpt.BrandId == id)
                .ToListAsync();

            if (brandProductTypes.Any())
            {
                _context.BrandProductTypes.RemoveRange(brandProductTypes);
            }

            // Then remove the brand
            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Delete",
                    "Brand",
                    id,
                    brandName,
                    $"Marka silindi: {brandName}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }

        // POST: api/Brands/5/ProductTypes
        [HttpPost("{id}/ProductTypes")]
        public async Task<IActionResult> AddProductTypeToBrand(int id, [FromBody] int productTypeId)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null)
            {
                return NotFound("Marka bulunamadı.");
            }

            var productType = await _context.ProductTypes.FindAsync(productTypeId);
            if (productType == null)
            {
                return NotFound("Ürün türü bulunamadı.");
            }

            // Check if relationship already exists
            var existingRelationship = await _context.BrandProductTypes
                .FirstOrDefaultAsync(bpt => bpt.BrandId == id && bpt.ProductTypeId == productTypeId);

            if (existingRelationship != null)
            {
                return BadRequest("Bu marka-ürün türü ilişkisi zaten mevcut.");
            }

            var brandProductType = new BrandProductType
            {
                BrandId = id,
                ProductTypeId = productTypeId,
                CreatedAt = DateTime.UtcNow
            };

            _context.BrandProductTypes.Add(brandProductType);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Create",
                    "BrandProductType",
                    brandProductType.Id,
                    $"{brand.Ad} - {productType.Ad}",
                    $"Marka-ürün türü ilişkisi oluşturuldu: {brand.Ad} - {productType.Ad}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }

        // DELETE: api/Brands/5/ProductTypes/3
        [HttpDelete("{id}/ProductTypes/{productTypeId}")]
        public async Task<IActionResult> RemoveProductTypeFromBrand(int id, int productTypeId)
        {
            var relationship = await _context.BrandProductTypes
                .FirstOrDefaultAsync(bpt => bpt.BrandId == id && bpt.ProductTypeId == productTypeId);

            if (relationship == null)
            {
                return NotFound("Marka-ürün türü ilişkisi bulunamadı.");
            }

            // Check if there are models using this relationship
            var hasModels = await _context.Models.AnyAsync(m => m.BrandId == id && m.ProductTypeId == productTypeId);
            if (hasModels)
            {
                return BadRequest("Bu ilişki kullanımda olduğu için silinemez.");
            }

            var brand = await _context.Brands.FindAsync(id);
            var productType = await _context.ProductTypes.FindAsync(productTypeId);

            _context.BrandProductTypes.Remove(relationship);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null && brand != null && productType != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Delete",
                    "BrandProductType",
                    relationship.Id,
                    $"{brand.Ad} - {productType.Ad}",
                    $"Marka-ürün türü ilişkisi silindi: {brand.Ad} - {productType.Ad}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }
    }
} 