using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<UserDetailResponse>>> GetUser(Guid id)
        {
            var result = await _userService.GetUserByIdAsync(id);

            if (!result.IsSuccess)
            {
                return NotFound(result.Error!);
            }

            return Ok(SuccessResponse<UserDetailResponse>.SuccessResult(
                result.Value!,
                message: "User retrieved successfully"));
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<UserDetailResponse>>> GetProfile()
        {
            var userId = User.GetRequiredUserId();

            var result = await _userService.GetUserByIdAsync(userId);

            if (!result.IsSuccess)
            {
                return NotFound(result.Error!);
            }

            return Ok(SuccessResponse<UserDetailResponse>.SuccessResult(
                result.Value!,
                message: "Profile retrieved successfully"));
        }

        [HttpPatch("profile")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateProfile([FromForm] UpdateUserRequest request)
        {
            var userId = User.GetRequiredUserId();

            var result = await _userService.UpdateUserAsync(userId, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new {},
                SuccessCodes.Updated,
                "Profile updated successfully"));
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<UserResponse>>>> GetAllUsers(string? email, string? name, string? role,
                                                                                    [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _userService.GetAllUsersAsync(pageNumber, pageSize, email, name, role);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<UserResponse>>.SuccessResult(
                result.Value!,
                message: "Users retrieved successfully"));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> BanUser(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _userService.BanUserAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Ban user successfully"));
        }
    }
}
