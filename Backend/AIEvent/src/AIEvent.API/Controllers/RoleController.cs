using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RoleController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RoleController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        public async Task<ActionResult<SuccessResponse<List<RoleResponse>>>> GetAllRoles()
        {
            var result = await _roleService.GetAllRolesAsync();

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<List<RoleResponse>>.SuccessResult(
                result.Value!,
                message: "Roles retrieved successfully"));
        }



        [HttpPost]
        public async Task<ActionResult<SuccessResponse<RoleResponse>>> CreateRole([FromBody] CreateRoleRequest request)
        {
            var result = await _roleService.CreateRoleAsync(request);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<RoleResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Created,
                "Role created successfully"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SuccessResponse<RoleResponse>>> UpdateRole(string id, [FromBody] UpdateRoleRequest request)
        {
            var result = await _roleService.UpdateRoleAsync(id, request);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<RoleResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Updated,
                "Role updated successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteRole(string id)
        {
            var result = await _roleService.DeleteRoleAsync(id);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "Role deleted successfully"));
        }
    }
}
