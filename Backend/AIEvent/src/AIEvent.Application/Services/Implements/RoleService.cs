using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Identity;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class RoleService : IRoleService
    {
        private readonly RoleManager<AppRole> _roleManager;
        private readonly UserManager<AppUser> _userManager;
        private readonly IMapper _mapper;

        public RoleService(
            RoleManager<AppRole> roleManager,
            UserManager<AppUser> userManager,
            IMapper mapper)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _mapper = mapper;
        }

        public async Task<Result<List<RoleResponse>>> GetAllRolesAsync()
        {
            var roles = await _roleManager.Roles.ToListAsync();
            var roleResponses = _mapper.Map<List<RoleResponse>>(roles);
            return Result<List<RoleResponse>>.Success(roleResponses);
        }
        
        public async Task<Result<RoleResponse>> CreateRoleAsync(CreateRoleRequest request)
        {
            var existingRole = await _roleManager.FindByNameAsync(request.Name);
            if (existingRole != null)
            {
                return ErrorResponse.FailureResult("Role with this name already exists", ErrorCodes.InvalidInput);
            }

            var role = _mapper.Map<AppRole>(request);

            var result = await _roleManager.CreateAsync(role);
            if (!result.Succeeded)
            {
                return ErrorResponse.FailureResult("Failed to create role", ErrorCodes.InvalidInput);
            }

            var roleResponse = _mapper.Map<RoleResponse>(role);
            return Result<RoleResponse>.Success(roleResponse);
        }

        public async Task<Result<RoleResponse>> UpdateRoleAsync(string roleId, UpdateRoleRequest request)
        {
            var role = await _roleManager.FindByIdAsync(roleId);
            if (role == null)
            {
                return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            }

            _mapper.Map(request, role);

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
            {
                return ErrorResponse.FailureResult("Failed to update role", ErrorCodes.InvalidInput);
            }

            var roleResponse = _mapper.Map<RoleResponse>(role);
            return Result<RoleResponse>.Success(roleResponse);
        }

        public async Task<Result> DeleteRoleAsync(string roleId)
        {
            var role = await _roleManager.FindByIdAsync(roleId);
            if (role == null)
            {
                return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            }

            var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
            if (usersInRole.Any())
            {
                return ErrorResponse.FailureResult("Failed to delete role. Role may be in use or system protected", ErrorCodes.InvalidInput);
            }

            var result = await _roleManager.DeleteAsync(role);
            if (!result.Succeeded)
            {
                return ErrorResponse.FailureResult("Failed to delete role. Role may be in use or system protected", ErrorCodes.InvalidInput);
            }

            return Result.Success();
        }
    }
}
