using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthService.Dtos;
using AuthService.Models;
using AuthService.Services;
using AuthService.Settings;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly JwtSettings _jwtSettings;

        public AuthController(UserService userService, IOptions<JwtSettings> jwtOptions)
        {
            _userService = userService;
            _jwtSettings = jwtOptions.Value;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "username y password son obligatorios" });
            }

            if (await _userService.UsernameExistsAsync(request.Username))
            {
                return Conflict(new { message = "El username ya está en uso" });
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            await _userService.CreateAsync(user);

            return CreatedAtAction(nameof(Me), new { }, new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _userService.GetByUsernameAsync(request.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Credenciales inválidas" });
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Key);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id!),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim("username", user.Username),
            };

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiresInMinutes),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(descriptor);
            var tokenString = tokenHandler.WriteToken(token);

            var response = new AuthResponse
            {
                Token = tokenString,
                Id = user.Id!,
                Username = user.Username,
                Email = user.Email
            };

            return Ok(response);
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var username = User.FindFirst("username")?.Value;
            var userId = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            return Ok(new
            {
                id = userId,
                username
            });
        }
    }
}
