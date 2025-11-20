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
        private readonly IActivityLogService _activityLogService;

        public UserController(IUserService userService, IActivityLogService activityLogService)
        {
            _userService = userService;
            _activityLogService = activityLogService;
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
        [Authorize(Roles = "Admin")]
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
                SuccessCodes.Deleted,
                "Ban user successfully"));
        }

        [HttpPatch("unban/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<object>>> UnBanUser(string id)
        {
            var result = await _userService.UnBanUserAsync(id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "UnBan user successfully"));
        }

        [HttpGet("banned")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<UserResponse>>>> GetAllUsersBanned(string? email, string? name, string? role,
                                                                                    [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _userService.GetAllUsersBannedAsync(pageNumber, pageSize, email, name, role);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<UserResponse>>.SuccessResult(
                result.Value!,
                message: "Users retrieved successfully"));
        }

        [HttpPost("manager")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateManagerAccount([FromForm] CreateAccountRequest request)
        {
            var result = await _userService.CreateManagerAccountAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create Manager successfully"));
        }

        [HttpPost("staff")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateStaffAccount([FromForm] CreateAccountRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _userService.CreateStaffAccountAsync(userId, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create Staff successfully"));
        }

        [HttpGet("staff")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<AccountResponse>>>> GetAllStaff(string? email, string? name,
                                                                                    [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _userService.GetAllStaffAsync(pageNumber, pageSize, email, name, userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<AccountResponse>>.SuccessResult(
                result.Value!,
                message: "Staffs retrieved successfully"));
        }

        [HttpDelete("staff/{id}")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> BanStaff(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _userService.BanStaffAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "Ban Staff successfully"));
        }

        [HttpPatch("location")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> TurnOnOffLocation(bool action)
        {
            var userId = User.GetRequiredUserId();
            var result = await _userService.TurnOnOffLocationAsync(userId, action);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Successfully"));
        }

        [HttpGet("{id}/activity-log")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ActivityLogResponse>>>> GetUserActivityLog(string id, DateTimeOffset? startDate, DateTimeOffset? endDate,
                                                                                    [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var result = await _activityLogService.GetActivityLogsByUserAsync(id, startDate, endDate, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ActivityLogResponse>>.SuccessResult(
                result.Value!,
                message: "ActivityLog retrieved successfully"));
        }
    }
}
