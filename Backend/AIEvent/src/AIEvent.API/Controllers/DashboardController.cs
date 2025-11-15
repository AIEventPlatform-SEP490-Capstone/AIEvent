using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Dashboard;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("event-statistics")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<EventStatisticsResponse>>> GetEventStatistics([FromQuery] DashboardFilterRequest? filter)
        {
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _dashboardService.GetEventStatisticsAsync(organizerId, filter);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<EventStatisticsResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event statistics retrieved successfully"));
        }

        [HttpGet("buyer-statistics")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<BuyerStatisticsResponse>>> GetBuyerStatistics([FromQuery] DashboardFilterRequest? filter)
        {
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _dashboardService.GetBuyerStatisticsAsync(organizerId, filter);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BuyerStatisticsResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Buyer statistics retrieved successfully"));
        }

        [HttpGet("checkin-statistics")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<CheckInStatisticsResponse>>> GetCheckInStatistics([FromQuery] DashboardFilterRequest? filter)
        {
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _dashboardService.GetCheckInStatisticsAsync(organizerId, filter);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<CheckInStatisticsResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Check-in statistics retrieved successfully"));
        }

        [HttpGet("revenue-statistics")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<RevenueStatisticsResponse>>> GetRevenueStatistics([FromQuery] DashboardFilterRequest? filter)
        {
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _dashboardService.GetRevenueStatisticsAsync(organizerId, filter);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<RevenueStatisticsResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Revenue statistics retrieved successfully"));
        }

        [HttpGet("net-revenue-statistics")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<NetRevenueStatisticsResponse>>> GetNetRevenueStatistics([FromQuery] DashboardFilterRequest? filter)
        {
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _dashboardService.GetNetRevenueStatisticsAsync(organizerId, filter);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<NetRevenueStatisticsResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Net revenue statistics retrieved successfully"));
        }

        [HttpGet("revenue-by-category-tag")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<RevenueByCategoryTagResponse>>> GetRevenueByCategoryTag([FromQuery] DashboardFilterRequest? filter)
        {
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _dashboardService.GetRevenueByCategoryTagAsync(organizerId, filter);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<RevenueByCategoryTagResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Revenue by category/tag retrieved successfully"));
        }

        [HttpPatch("system-setting")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateSystemSetting(SystemSettingRequest request)
        {
            string userId = User.GetRequiredUserId().ToString();
            var result = await _dashboardService.UpdateSystemSetiing(userId, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "SystemSetting updated successfully"));
        }

        [HttpGet("system-setting")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<SystemSettingResponse>>> GetSystemSetting()
        {
            string userId = User.GetRequiredUserId().ToString();
            var result = await _dashboardService.GetSystemSetting(userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<SystemSettingResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "SystemSetting retrieved successfully"));
        }
    }
}
