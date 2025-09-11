using System.Security.Claims;

namespace AIEvent.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static string GetRequiredUserId(this ClaimsPrincipal principal)
        {
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }
            return userId;
        }
    }
}
