namespace AIEvent.Application.DTOs.Dashboard
{
    public class RevenueStatisticsResponse
    {
        public decimal TotalRevenue { get; set; }
        public List<EventRevenueResponse> RevenueByEvent { get; set; } = new();
    }
}
