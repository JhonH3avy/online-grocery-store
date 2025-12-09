using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Infrastructure;

namespace Server.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;

        public UsersController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id.ToString() == id);
            if (user == null) return NotFound();
            return Ok(new
            {
                id = user.Id.ToString(),
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                role = user.Role.ToString(),
                isActive = user.IsActive
            });
        }
    }
}
