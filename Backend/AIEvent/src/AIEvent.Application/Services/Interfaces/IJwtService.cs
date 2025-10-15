using AIEvent.Domain.Entities;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IJwtService
    { 
        string GenerateAccessToken(User user);
        string GenerateRefreshToken();  
    }
}
