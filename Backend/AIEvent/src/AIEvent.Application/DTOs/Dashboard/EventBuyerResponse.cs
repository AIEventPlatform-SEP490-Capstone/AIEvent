namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventBuyerResponse
    {
        public Guid EventId { get; set; }
        public string? EventName { get; set; }
        public int BuyerCount { get; set; }
    }
}
