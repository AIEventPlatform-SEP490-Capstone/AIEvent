using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Identity;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class UserService : IUserService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;

        public UserService(
            UserManager<AppUser> userManager,
            IMapper mapper)
        {
            _userManager = userManager;
            _mapper = mapper;
        }

        public async Task<Result<UserResponse>> GetUserByIdAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);
            }

            if (!user.IsActive)
            {
                return ErrorResponse.FailureResult("User account is inactive", ErrorCodes.NotFound);
            }

            var userResponse = _mapper.Map<UserResponse>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userResponse.Roles = [.. roles];

            return Result<UserResponse>.Success(userResponse);
        }

        public async Task<Result<UserResponse>> UpdateUserAsync(string userId, UpdateUserRequest request)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);
            }

            if (!user.IsActive)
            {
                return ErrorResponse.FailureResult("User account is inactive", ErrorCodes.NotFound);
            }

            _mapper.Map(request, user);

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return ErrorResponse.FailureResult("Failed to update user", ErrorCodes.InvalidInput);
            }

            var userResponse = _mapper.Map<UserResponse>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userResponse.Roles = [.. roles];

            return Result<UserResponse>.Success(userResponse);
        }

        public async Task<Result<List<UserResponse>>> GetAllUsersAsync(int page = 1, int pageSize = 10)
        {
            var users = await _userManager.Users
                .Where(u => u.IsActive)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userResponses = new List<UserResponse>();
            foreach (var user in users)
            {
                var userResponse = _mapper.Map<UserResponse>(user);
                var roles = await _userManager.GetRolesAsync(user);
                userResponse.Roles = [.. roles];
                userResponses.Add(userResponse);
            }

            return Result<List<UserResponse>>.Success(userResponses);
        }

    }
}
