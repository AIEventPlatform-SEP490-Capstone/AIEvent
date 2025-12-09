using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Dashboard; 
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;
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

        [HttpPost("system-setting")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateSystemSetting(SystemSettingRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _dashboardService.CreateSystemSetting(userId, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "SystemSetting created successfully"));
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

        [HttpGet("history-system-setting")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<List<SystemSettingResponse>>>> GetListSystemSetting()
        {
            string userId = User.GetRequiredUserId().ToString();
            var result = await _dashboardService.GetSystemSettingListAsync(userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<List<SystemSettingResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "SystemSetting retrieved successfully"));
        }

        [HttpGet("admin-overview")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<AdminDashboardResponse>>> GetAdminDashboard(
            [FromQuery] int? year = null,
            [FromQuery] int? month = null)
        {
            var result = await _dashboardService.GetAdminDashboardAsync(year, month);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<AdminDashboardResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Admin dashboard retrieved successfully"));
        }

        [HttpGet("admin/event-management")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventManagementResponse>>>> GetEventManagement(
            [FromQuery] string? search = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _dashboardService.GetEventManagementAsync(search, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventManagementResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event management retrieved successfully"));
        }

        [HttpGet("admin/user-management")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<UserManagementResponse>>>> GetUserManagement(
            [FromQuery] string? search = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _dashboardService.GetUserManagementAsync(search, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<UserManagementResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "User management retrieved successfully"));
        }

        [HttpGet("admin/system-report")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<SystemReportResponse>>> GetSystemReport(
            [FromQuery] int recentActivitiesPageNumber = 1,
            [FromQuery] int recentActivitiesPageSize = 10)
        {
            var result = await _dashboardService.GetSystemReportAsync(recentActivitiesPageNumber, recentActivitiesPageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<SystemReportResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "System report retrieved successfully"));
        }

        [HttpGet("organizer-approved-statistics")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<SuccessResponse<List<OrganizerStatisticResponse>>>> GetStatisticsOrganizer(int year, OrganizerProfileStatus status)
        {
            var result = await _dashboardService.StatisticsOrganizersAsync(year, status);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<List<OrganizerStatisticResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Statistics Organizer retrieved successfully"));
        }

        [HttpGet("event-month-statistics")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<SuccessResponse<List<EventStatisticByMonthResponse>>>> GetStatisticsEventByMonth(int year, EventStatus status)
        {
            var result = await _dashboardService.GetStatisticsEventsByMonthAsync(year, status);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<List<EventStatisticByMonthResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Statistics Event retrieved successfully"));
        }

        [HttpGet("organizer-join-statistics")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<SuccessResponse<List<OrganizerStatisticResponse>>>> GetTotalOrganizersCreatedEventsByMonth(int year)
        {
            var result = await _dashboardService.GetTotalOrganizersCreatedEventsByMonthAsync(year);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<List<OrganizerStatisticResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Organizer retrieved successfully"));
        }

        [HttpGet("total-organizer-event")]
        [Authorize(Roles = "Manager")]
        public async Task<ActionResult<SuccessResponse<ApprovedSummaryResponse>>> GetOrganizerAndEventApprovedSummary()
        {
            var result = await _dashboardService.GetOrganizerAndEventApprovedSummaryAsync();

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<ApprovedSummaryResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Organizer retrieved successfully"));
        }
    }
}
