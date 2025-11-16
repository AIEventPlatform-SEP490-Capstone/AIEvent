using AIEvent.Domain.Bases;

namespace AIEvent.Application.DTOs.Dashboard
{
    public class SystemReportResponse
    { 
        public MonthlyStatistics MonthlyStatistics { get; set; } = null!;
        public BasePaginated<RecentActivityResponse> RecentActivities { get; set; } = null!;
    }
}

