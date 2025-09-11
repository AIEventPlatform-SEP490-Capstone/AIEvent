using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTO.Common;
using AIEvent.Application.DTO.User;
using AIEvent.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
        public async Task<ActionResult<SuccessResponse<UserResponse>>> GetUser(string id)
        {
            var result = await _userService.GetUserByIdAsync(id);

            if (result.IsFailure)
            {
                return NotFound(result.Error!);
            }

            return Ok(SuccessResponse<UserResponse>.SuccessResult(
                result.Value!,
                message: "User retrieved successfully"));
        }

        [HttpGet("profile")]
        public async Task<ActionResult<SuccessResponse<UserResponse>>> GetProfile()
        {
            var userId = User.GetRequiredUserId();

            var result = await _userService.GetUserByIdAsync(userId);

            if (result.IsFailure)
            {
                return NotFound(result.Error!);
            }

            return Ok(SuccessResponse<UserResponse>.SuccessResult(
                result.Value!,
                message: "Profile retrieved successfully"));
        }

        [HttpPut("profile")]
        public async Task<ActionResult<SuccessResponse<UserResponse>>> UpdateProfile([FromBody] UpdateUserRequest request)
        {
            var userId = User.GetRequiredUserId();

            var result = await _userService.UpdateUserAsync(userId, request);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<UserResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Updated,
                "Profile updated successfully"));
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<List<UserResponse>>>> GetAllUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _userService.GetAllUsersAsync(page, pageSize);

            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<List<UserResponse>>.SuccessResult(
                result.Value!,
                message: "Users retrieved successfully"));
        }
    }
}
