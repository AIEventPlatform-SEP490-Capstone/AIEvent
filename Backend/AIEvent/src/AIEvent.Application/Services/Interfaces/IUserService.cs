using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IUserService
    {
        Task<Result<UserDetailResponse>> GetUserByIdAsync(Guid userId);
        Task<Result> UpdateUserAsync(Guid userId, UpdateUserRequest request);
        Task<Result<BasePaginated<UserResponse>>> GetAllUsersAsync(int pageNumber, int pageSize, string? email, string? name, string? role);
        Task<Result> BanUserAsync(Guid userId, string id);
    }
}
