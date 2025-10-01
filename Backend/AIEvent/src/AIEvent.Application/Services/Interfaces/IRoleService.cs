using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IRoleService
    {
        Task<Result<List<RoleResponse>>> GetAllRolesAsync();
        Task<Result<RoleResponse>> CreateRoleAsync(CreateRoleRequest request);
        Task<Result<RoleResponse>> UpdateRoleAsync(string roleId, UpdateRoleRequest request);
        Task<Result> DeleteRoleAsync(string roleId);
    }
}
