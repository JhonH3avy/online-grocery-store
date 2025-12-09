using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Domain.Entities;
using Server.Infrastructure;

namespace Server.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AuthController(AppDbContext db)
        {
            _db = db;
        }

        public record LoginRequest(string Email, string Password);
        public record RegisterRequest(string Email, string Password, string FirstName, string LastName, string? Phone);

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest body)
        {
            if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                return BadRequest(new { message = "Email and password are required" });

            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == body.Email);
            if (user == null || user.Password != body.Password)
                return Unauthorized(new { message = "Invalid credentials" });

            // Parity placeholder: return basic user info (Node may issue JWT; we'll add later)
            return Ok(new
            {
                user = new
                {
                    id = user.Id.ToString(),
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    role = user.Role.ToString(),
                }
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest body)
        {
            if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password) || string.IsNullOrWhiteSpace(body.FirstName) || string.IsNullOrWhiteSpace(body.LastName))
                return BadRequest(new { message = "Missing required fields" });

            var exists = await _db.Users.AnyAsync(u => u.Email == body.Email);
            if (exists) return Conflict(new { message = "Email already registered" });

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = body.Email,
                Password = body.Password, // parity: plaintext like existing seed; will hash later
                FirstName = body.FirstName,
                LastName = body.LastName,
                Phone = body.Phone,
                Role = UserRole.CUSTOMER,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                user = new
                {
                    id = user.Id.ToString(),
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    role = user.Role.ToString(),
                }
            });
        }
    }
}
