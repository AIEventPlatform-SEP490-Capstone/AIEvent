namespace AIEvent.Application.DTOs.Dashboard
{
    public class NetRevenueStatisticsResponse
    {
        public decimal TotalNetRevenue { get; set; }
        public List<EventNetRevenueResponse> NetRevenueByEvent { get; set; } = new();
    }

}
