using AIEvent.Domain.Identity;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IJwtService
    { 
        string GenerateAccessToken(AppUser user, IList<string> roles);
        string GenerateRefreshToken();  
    }
}
