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
        Task<Result> UnBanUserAsync(Guid userId, string id);
        Task<Result<BasePaginated<UserResponse>>> GetAllUsersBannedAsync(int pageNumber, int pageSize, string? email, string? name, string? role);
        Task<Result> CreateManagerAccountAsync(CreateAccountRequest request);
        Task<Result> CreateStaffAccountAsync(Guid userId, CreateAccountRequest request);
        Task<Result<BasePaginated<AccountResponse>>> GetAllStaffAsync(int pageNumber, int pageSize, string? email, string? name, Guid userId);
        Task<Result> BanStaffAsync(Guid userId, string id);
    }
}
