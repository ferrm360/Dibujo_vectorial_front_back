using System.Security.Claims;
using DrawingService.Models;
using DrawingService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DrawingService.Controllers
{
    [ApiController]
    [Route("api/drawings")]
    [Authorize]
    public class DrawingsController : ControllerBase
    {
        private readonly DrawingsService _drawingsService;

        public DrawingsController(DrawingsService drawingsService)
        {
            _drawingsService = drawingsService;
        }

        private string GetUserId()
        {
            return User.FindFirst("sub")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? throw new Exception("User id not found in token");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ownerId = GetUserId();
            var drawings = await _drawingsService.GetByOwnerAsync(ownerId);
            return Ok(drawings);
        }

        public class CreateDrawingRequest
        {
            public string Title { get; set; } = null!;
            public string SvgContent { get; set; } = null!;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDrawingRequest request)
        {
            var ownerId = GetUserId();

            var drawing = new Drawing
            {
                OwnerId = ownerId,
                Title = request.Title,
                SvgContent = request.SvgContent
            };

            var created = await _drawingsService.CreateAsync(drawing);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var ownerId = GetUserId();
            var drawing = await _drawingsService.GetByIdAsync(id, ownerId);
            if (drawing == null) return NotFound();
            return Ok(drawing);
        }

        public class UpdateDrawingRequest
        {
            public string Title { get; set; } = null!;
            public string SvgContent { get; set; } = null!;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateDrawingRequest request)
        {
            var ownerId = GetUserId();
            var updated = await _drawingsService.UpdateAsync(id, ownerId, request.Title, request.SvgContent);
            if (!updated) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var ownerId = GetUserId();
            var deleted = await _drawingsService.DeleteAsync(id, ownerId);
            if (!deleted) return NotFound();
            return NoContent();
        }
    }
}
