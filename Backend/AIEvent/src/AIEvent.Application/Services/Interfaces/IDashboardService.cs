using AIEvent.Application.DTOs.Dashboard;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

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
        Task<Result> UpdateSystemSetiing(string adminId, SystemSettingRequest request);
        Task<Result<SystemSettingResponse>> GetSystemSetting(string adminId);
        Task<Result<AdminDashboardResponse>> GetAdminDashboardAsync(int pendingEventsPageNumber = 1, int pendingEventsPageSize = 10, 
                                                                     int pendingOrganizersPageNumber = 1, int pendingOrganizersPageSize = 10,
                                                                     int newUsersPageNumber = 1, int newUsersPageSize = 10);
        Task<Result<BasePaginated<EventManagementResponse>>> GetEventManagementAsync(string? search = null, int pageNumber = 1, int pageSize = 10);
        Task<Result<BasePaginated<UserManagementResponse>>> GetUserManagementAsync(string? search = null, int pageNumber = 1, int pageSize = 10);
        Task<Result<SystemReportResponse>> GetSystemReportAsync(int recentActivitiesPageNumber = 1, int recentActivitiesPageSize = 10);
    }
}

