using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using TradeFlowSystemAPI.Data;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class JobsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public JobsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobDto>>> GetJobs()
        {
            var jobs = await _context.Jobs
                .Include(j => j.JobProductTypes)
                    .ThenInclude(jpt => jpt.ProductType)
                .OrderBy(j => j.Ad)
                .Select(j => new JobDto
                {
                    Id = j.Id,
                    Ad = j.Ad,
                    CreatedAt = j.CreatedAt,
                    UpdatedAt = j.UpdatedAt,
                    ProductTypes = j.JobProductTypes
                        .OrderBy(jpt => jpt.ProductType.Ad)
                        .Select(jpt => new ProductTypeDto
                        {
                            Id = jpt.ProductType.Id,
                            Ad = jpt.ProductType.Ad,
                            CreatedAt = jpt.ProductType.CreatedAt,
                            UpdatedAt = jpt.ProductType.UpdatedAt
                        }).ToList()
                })
                .ToListAsync();
            return Ok(jobs);
        }

        [HttpPost]
        public async Task<ActionResult<JobDto>> CreateJob(CreateJobDto dto)
        {
            if (await _context.Jobs.AnyAsync(j => j.Ad.ToLower() == dto.Ad.ToLower()))
            {
                return BadRequest("Bu iş tanımı zaten mevcut.");
            }
            var job = new Job { Ad = dto.Ad, CreatedAt = DateTime.UtcNow };
            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();
            var jobDto = new JobDto { Id = job.Id, Ad = job.Ad, CreatedAt = job.CreatedAt, UpdatedAt = job.UpdatedAt };
            return CreatedAtAction(nameof(GetJobs), new { id = job.Id }, jobDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(int id, UpdateJobDto dto)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null) return NotFound();
            if (await _context.Jobs.AnyAsync(j => j.Ad.ToLower() == dto.Ad.ToLower() && j.Id != id))
            {
                return BadRequest("Bu iş tanımı zaten mevcut.");
            }
            job.Ad = dto.Ad;
            job.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(int id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null) return NotFound();
            var relations = await _context.JobProductTypes.Where(x => x.JobId == id).ToListAsync();
            if (relations.Any()) _context.JobProductTypes.RemoveRange(relations);
            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{id}/ProductTypes")]
        public async Task<ActionResult<IEnumerable<object>>> GetJobProductTypes(int id)
        {
            var list = await _context.JobProductTypes
                .Where(jpt => jpt.JobId == id)
                .Include(jpt => jpt.ProductType)
                .Select(jpt => new {
                    Id = jpt.Id,
                    JobId = jpt.JobId,
                    ProductTypeId = jpt.ProductTypeId,
                    ProductType = new ProductTypeDto { Id = jpt.ProductType.Id, Ad = jpt.ProductType.Ad, CreatedAt = jpt.ProductType.CreatedAt, UpdatedAt = jpt.ProductType.UpdatedAt },
                    CreatedAt = jpt.CreatedAt
                })
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost("{id}/ProductTypes")]
        public async Task<IActionResult> AddProductTypeToJob(int id, [FromBody] int productTypeId)
        {
            if (!await _context.Jobs.AnyAsync(j => j.Id == id)) return NotFound("İş tanımı bulunamadı.");
            if (!await _context.ProductTypes.AnyAsync(pt => pt.Id == productTypeId)) return NotFound("Ürün türü bulunamadı.");
            var exists = await _context.JobProductTypes.FirstOrDefaultAsync(x => x.JobId == id && x.ProductTypeId == productTypeId);
            if (exists != null) return BadRequest("Bu ilişki zaten mevcut.");
            _context.JobProductTypes.Add(new JobProductType { JobId = id, ProductTypeId = productTypeId, CreatedAt = DateTime.UtcNow });
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}/ProductTypes/{productTypeId}")]
        public async Task<IActionResult> RemoveProductTypeFromJob(int id, int productTypeId)
        {
            var rel = await _context.JobProductTypes.FirstOrDefaultAsync(x => x.JobId == id && x.ProductTypeId == productTypeId);
            if (rel == null) return NotFound("İlişki bulunamadı.");
            _context.JobProductTypes.Remove(rel);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}


