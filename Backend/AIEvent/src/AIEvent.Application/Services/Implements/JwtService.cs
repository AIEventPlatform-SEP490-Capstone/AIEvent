using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class JwtService : IJwtService
    {
        private readonly string _key;
        private readonly string _issuer;
        private readonly string _audience;

        public JwtService(
            IConfiguration configuration)
        {
            _key = configuration["Jwt:Key"] ?? throw new ArgumentNullException("JWT Key is not configured");
            _issuer = configuration["Jwt:Issuer"] ?? throw new ArgumentNullException("JWT Issuer is not configured");
            _audience = configuration["Jwt:Audience"] ?? throw new ArgumentNullException("JWT Audience is not configured");
            Console.WriteLine($"[DEBUG] JWT Key from config: {_key}");
        }

        public string GenerateAccessToken(AppUser user, IList<string> roles)
        {
            var key = Encoding.ASCII.GetBytes(_key);
            var claims = new List<Claim>
            {
                new(ClaimTypes.Name, user.UserName ?? string.Empty),
                new(ClaimTypes.Email, user.Email ?? string.Empty),
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new("organizer", user.OrganizerProfile?.Id.ToString() ?? string.Empty),
                new(JwtRegisteredClaimNames.Sub, user.OrganizerProfile?.Id.ToString() ?? string.Empty),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };
            
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            );

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(1), 
                SigningCredentials = credentials,
                Issuer = _issuer,
                Audience = _audience,
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}
