using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IUserService
    {
        Task<Result<UserDetailResponse>> GetUserByIdAsync(string userId);
        Task<Result<UserDetailResponse>> UpdateUserAsync(string userId, UpdateUserRequest request);
        Task<Result<List<UserResponse>>> GetAllUsersAsync(int page = 1, int pageSize = 10);
    }
}
