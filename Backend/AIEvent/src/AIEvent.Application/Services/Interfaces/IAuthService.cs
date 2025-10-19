using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IAuthService
    {
        Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
        Task<Result> RegisterAsync(RegisterRequest request);
        Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken);
        Task<Result> RevokeRefreshTokenAsync(string refreshToken);
        Task<Result<AuthResponse>> VerifyOTPAsync(VerifyOTPRequest request);
        Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    }
}
