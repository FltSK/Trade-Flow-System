using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TradeFlowSystemAPI.DTOs;
using TradeFlowSystemAPI.Services;

namespace TradeFlowSystemAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StokController : ControllerBase
    {
        private readonly StokService _stokService;

        public StokController(StokService stokService)
        {
            _stokService = stokService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllStoklar([FromQuery] bool? onlyActive = null)
        {
            var result = await _stokService.GetAllStoklarAsync(onlyActive);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPost("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(int id)
        {
            var result = await _stokService.SetActiveAsync(id, false);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }

        [HttpPost("{id}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            var result = await _stokService.SetActiveAsync(id, true);
            if (result.Success) return Ok(result);
            return BadRequest(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetStokById(int id)
        {
            var result = await _stokService.GetStokByIdAsync(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return NotFound(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateStok([FromBody] CreateStokDto createStokDto)
        {
            var result = await _stokService.CreateStokAsync(createStokDto);
            if (result.Success && result.Data != null)
            {
                return CreatedAtAction(nameof(GetStokById), new { id = result.Data.Id }, result);
            }
            return BadRequest(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStok(int id, [FromBody] UpdateStokDto updateStokDto)
        {
            var result = await _stokService.UpdateStokAsync(id, updateStokDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStok(int id)
        {
            var result = await _stokService.DeleteStokAsync(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreStok(int id)
        {
            var result = await _stokService.RestoreStokAsync(id);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPost("hareket")]
        public async Task<IActionResult> CreateStokHareketi([FromBody] CreateStokHareketiDto createStokHareketiDto)
        {
            var result = await _stokService.CreateStokHareketiAsync(createStokHareketiDto);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("hareketler")]
        public async Task<IActionResult> GetAllStokHareketleri()
        {
            var result = await _stokService.GetAllStokHareketleriAsync();
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("{stokId}/hareketler")]
        public async Task<IActionResult> GetStokHareketleri(int stokId)
        {
            var result = await _stokService.GetStokHareketleriAsync(stokId);
            if (result.Success)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }
    }
} 