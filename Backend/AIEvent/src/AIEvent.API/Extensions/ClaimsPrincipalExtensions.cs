using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AIEvent.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetRequiredUserId(this ClaimsPrincipal principal)
        {
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var guid))
            {
                throw new UnauthorizedAccessException("Invalid User ID in token");
            }
            return guid;
        }

        public static Guid GetRequiredOrganizerId(this ClaimsPrincipal principal)
        {
            var organizerId = principal.FindFirst("organizer")?.Value;
            if (string.IsNullOrEmpty(organizerId) || !Guid.TryParse(organizerId, out var guid))
            {
                throw new UnauthorizedAccessException("Invalid Organizer ID in token");
            }
            return guid;
        }
    }
}
