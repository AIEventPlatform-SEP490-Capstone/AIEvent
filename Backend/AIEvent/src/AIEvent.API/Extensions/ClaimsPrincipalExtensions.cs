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

        public static string GetRoleFromClaim(this ClaimsPrincipal principal)
        {
            var role = principal.FindFirst(ClaimTypes.Role)?.Value
                       ?? principal.FindFirst("role")?.Value;

            if (string.IsNullOrEmpty(role))
            {
                throw new UnauthorizedAccessException("Role not found in token");
            }

            return role;
        }
    }
}
