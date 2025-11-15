using AIEvent.Application.DTOs.Dashboard;
using AIEvent.Application.Helpers;

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
        Task<Result<SystemSettingRequest>> GetSystemSetting(string adminId);
    }
}

