namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventRevenueResponse
    {
        public Guid EventId { get; set; }
        public string? EventName { get; set; }
        public decimal Revenue { get; set; }
    }
}
