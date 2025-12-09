using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Infrastructure;

namespace Server.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubcategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public SubcategoriesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? category, [FromQuery] string? slug)
        {
            var query = _db.Subcategories.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(sc => sc.Category.Slug == category);
            }

            if (!string.IsNullOrWhiteSpace(slug))
            {
                query = query.Where(sc => sc.Slug == slug);
            }

            query = query.OrderBy(sc => sc.Name);

            var items = await query.ToListAsync();
            return Ok(new { items, total = items.Count });
        }
    }
}
