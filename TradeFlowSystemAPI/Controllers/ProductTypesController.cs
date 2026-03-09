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
    public class ProductTypesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IActivityLogService _activityLogService;

        public ProductTypesController(ApplicationDbContext context, IActivityLogService activityLogService)
        {
            _context = context;
            _activityLogService = activityLogService;
        }

        // GET: api/ProductTypes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductTypeDto>>> GetProductTypes()
        {
            var productTypes = await _context.ProductTypes
                .OrderBy(pt => pt.Ad)
                .Select(pt => new ProductTypeDto
                {
                    Id = pt.Id,
                    Ad = pt.Ad,
                    CreatedAt = pt.CreatedAt,
                    UpdatedAt = pt.UpdatedAt
                })
                .ToListAsync();

            return Ok(productTypes);
        }

        // GET: api/ProductTypes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductTypeDto>> GetProductType(int id)
        {
            var productType = await _context.ProductTypes.FindAsync(id);

            if (productType == null)
            {
                return NotFound();
            }

            var productTypeDto = new ProductTypeDto
            {
                Id = productType.Id,
                Ad = productType.Ad,
                CreatedAt = productType.CreatedAt,
                UpdatedAt = productType.UpdatedAt
            };

            return Ok(productTypeDto);
        }

        // POST: api/ProductTypes
        [HttpPost]
        public async Task<ActionResult<ProductTypeDto>> CreateProductType(CreateProductTypeDto dto)
        {
            // Check if product type with same name already exists
            if (await _context.ProductTypes.AnyAsync(pt => pt.Ad.ToLower() == dto.Ad.ToLower()))
            {
                return BadRequest("Bu ürün türü zaten mevcut.");
            }

            var productType = new ProductType
            {
                Ad = dto.Ad,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductTypes.Add(productType);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Create",
                    "ProductType",
                    productType.Id,
                    productType.Ad,
                    $"Yeni ürün türü oluşturuldu: {productType.Ad}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            var productTypeDto = new ProductTypeDto
            {
                Id = productType.Id,
                Ad = productType.Ad,
                CreatedAt = productType.CreatedAt,
                UpdatedAt = productType.UpdatedAt
            };

            return CreatedAtAction(nameof(GetProductType), new { id = productType.Id }, productTypeDto);
        }

        // PUT: api/ProductTypes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProductType(int id, UpdateProductTypeDto dto)
        {
            var productType = await _context.ProductTypes.FindAsync(id);

            if (productType == null)
            {
                return NotFound();
            }

            // Check if product type with same name already exists (excluding current one)
            if (await _context.ProductTypes.AnyAsync(pt => pt.Ad.ToLower() == dto.Ad.ToLower() && pt.Id != id))
            {
                return BadRequest("Bu ürün türü zaten mevcut.");
            }

            var oldName = productType.Ad;
            productType.Ad = dto.Ad;
            productType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Update",
                    "ProductType",
                    productType.Id,
                    productType.Ad,
                    $"Ürün türü güncellendi: {oldName} → {productType.Ad}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }

        // DELETE: api/ProductTypes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProductType(int id)
        {
            var productType = await _context.ProductTypes.FindAsync(id);

            if (productType == null)
            {
                return NotFound();
            }

            // Check if product type is being used by any models
            var hasModels = await _context.Models.AnyAsync(m => m.ProductTypeId == id);
            if (hasModels)
            {
                return BadRequest("Bu ürün türü kullanımda olduğu için silinemez.");
            }

            // Check if product type is being used by any brand relationships
            var hasBrandRelationships = await _context.BrandProductTypes.AnyAsync(bpt => bpt.ProductTypeId == id);
            if (hasBrandRelationships)
            {
                return BadRequest("Bu ürün türü marka ilişkilerinde kullanımda olduğu için silinemez.");
            }

            var productTypeName = productType.Ad;
            _context.ProductTypes.Remove(productType);
            await _context.SaveChangesAsync();

            // Log activity
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            if (userId != null)
            {
                await _activityLogService.LogActivityAsync(
                    "Delete",
                    "ProductType",
                    id,
                    productTypeName,
                    $"Ürün türü silindi: {productTypeName}",
                    int.Parse(userId),
                    username ?? "Unknown"
                );
            }

            return NoContent();
        }
    }
} 