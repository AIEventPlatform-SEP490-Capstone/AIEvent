using AIEvent.Application.DTOs.Dashboard;
using AIEvent.Application.DTOs.RevenueReport;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<Result<EventStatisticsResponse>> GetEventStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null);
        Task<Result<BuyerStatisticsResponse>> GetBuyerStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null);
        Task<Result<CheckInStatisticsResponse>> GetCheckInStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null);
        Task<Result<RevenueStatisticsResponse>> GetRevenueStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null);
        Task<Result<NetRevenueStatisticsResponse>> GetNetRevenueStatisticsAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null);
        Task<Result<RevenueByCategoryTagResponse>> GetRevenueByCategoryTagAsync(Guid organizerProfileId, DashboardFilterRequest? filter = null);
        Task<Result> CreateSystemSetting(Guid id, SystemSettingRequest request);
        Task<Result<SystemSettingResponse>> GetSystemSetting(string adminId);
        Task<Result<AdminDashboardResponse>> GetAdminDashboardAsync(int? year = null, int? month = null);
        Task<Result<BasePaginated<EventManagementResponse>>> GetEventManagementAsync(string? search = null, int pageNumber = 1, int pageSize = 10);
        Task<Result<BasePaginated<UserManagementResponse>>> GetUserManagementAsync(string? search = null, int pageNumber = 1, int pageSize = 10);
        Task<Result<SystemReportResponse>> GetSystemReportAsync(int recentActivitiesPageNumber = 1, int recentActivitiesPageSize = 10);
        Task<Result<List<OrganizerStatisticResponse>>> StatisticsOrganizersAsync(int year, OrganizerProfileStatus status);
        Task<Result<List<EventStatisticByMonthResponse>>> GetStatisticsEventsByMonthAsync(int year, EventStatus status);
        Task<Result<List<OrganizerStatisticResponse>>> GetTotalOrganizersCreatedEventsByMonthAsync(int year);
        Task<Result<ApprovedSummaryResponse>> GetOrganizerAndEventApprovedSummaryAsync();
        Task<Result<BasePaginated<SystemSettingResponse>>> GetSystemSettingListAsync(string adminId, int pageNumber = 1, int pageSize = 10);
        Task<Result<BasePaginated<PayoutHistoryResponse>>> GetPayoutHistoryAsync(Guid? organizerId = null, string? search = null, int? year = null, int? month = null, int pageNumber = 1, int pageSize = 10);
    }
}

