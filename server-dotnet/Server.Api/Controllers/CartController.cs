using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain.Entities;
using Server.Infrastructure;

namespace Server.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CartController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest(new { message = "userId is required" });

            var items = await _db.CartItems
                .AsNoTracking()
                .Where(ci => ci.UserId.ToString() == userId)
                .OrderBy(ci => ci.CreatedAt)
                .ToListAsync();

            return Ok(new { items, total = items.Count });
        }

        public record AddCartItemRequest(string UserId, string ProductId, int Quantity);

        [HttpPost]
        public async Task<IActionResult> Add([FromBody] AddCartItemRequest body)
        {
            if (string.IsNullOrWhiteSpace(body.UserId) || string.IsNullOrWhiteSpace(body.ProductId) || body.Quantity <= 0)
                return BadRequest(new { message = "Invalid payload" });

            var userGuid = Guid.Parse(body.UserId);
            var productGuid = Guid.Parse(body.ProductId);

            var existing = await _db.CartItems.FirstOrDefaultAsync(ci => ci.UserId == userGuid && ci.ProductId == productGuid);
            if (existing != null)
            {
                existing.Quantity += body.Quantity;
                existing.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return Ok(existing);
            }

            var item = new CartItem
            {
                Id = Guid.NewGuid(),
                UserId = userGuid,
                ProductId = productGuid,
                Quantity = body.Quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.CartItems.Add(item);
            await _db.SaveChangesAsync();
            return Ok(item);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (!Guid.TryParse(id, out var guid))
                return BadRequest(new { message = "Invalid id" });

            var item = await _db.CartItems.FirstOrDefaultAsync(ci => ci.Id == guid);
            if (item == null) return NotFound();

            _db.CartItems.Remove(item);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
