using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Infrastructure;

namespace Server.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ProductsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? limit, [FromQuery] string? category, [FromQuery] string? subcategory)
        {
            try
            {
                var query = _db.Products.AsNoTracking().AsQueryable();
                if (!string.IsNullOrWhiteSpace(category))
                    query = query.Where(p => p.Category.Slug == category);
                if (!string.IsNullOrWhiteSpace(subcategory))
                    query = query.Where(p => p.Subcategory.Slug == subcategory);

                query = query.OrderByDescending(p => p.CreatedAt);
                if (limit.HasValue && limit.Value > 0)
                    query = query.Take(limit.Value);

                var items = await query.ToListAsync();
                return Ok(new { items, total = items.Count });
            }
            catch
            {
                // Fallback until DB is configured: return empty list
                var items = Array.Empty<object>();
                return Ok(new { items, total = 0 });
            }
        }
    }
}
