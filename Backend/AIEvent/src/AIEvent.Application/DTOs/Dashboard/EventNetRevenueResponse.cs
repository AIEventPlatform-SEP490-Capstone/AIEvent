namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventNetRevenueResponse
    {
        public Guid EventId { get; set; }
        public string? EventName { get; set; }
        public decimal NetRevenue { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal GrossRevenue { get; set; }
    }
}
