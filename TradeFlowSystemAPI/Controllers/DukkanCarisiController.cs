using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Services;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DukkanCarisiController : ControllerBase
    {
        private readonly DukkanCarisiService _dukkanCarisiService;

        public DukkanCarisiController(DukkanCarisiService dukkanCarisiService)
        {
            _dukkanCarisiService = dukkanCarisiService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _dukkanCarisiService.GetAllDukkanCarisiAsync();
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _dukkanCarisiService.GetDukkanCarisiByIdAsync(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDukkanCarisiDto createDukkanCarisiDto)
        {
            var result = await _dukkanCarisiService.CreateDukkanCarisiAsync(createDukkanCarisiDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateDukkanCarisiDto updateDukkanCarisiDto)
        {
            var result = await _dukkanCarisiService.UpdateDukkanCarisiAsync(id, updateDukkanCarisiDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _dukkanCarisiService.DeleteDukkanCarisiAsync(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? searchTerm, [FromQuery] string? islemFilter, [FromQuery] DateTime? baslangicTarihi, [FromQuery] DateTime? bitisTarihi)
        {
            var result = await _dukkanCarisiService.SearchDukkanCarisiAsync(searchTerm ?? "", islemFilter ?? "", baslangicTarihi, bitisTarihi);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
    }
} 