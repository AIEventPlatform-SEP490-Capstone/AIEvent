using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.AIRecommendation
{
    public class EventRecommendation
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? LocationName { get; set; }
        public string? District { get; set; }
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public TicketPricingType TicketPricingType { get; set; }
        public decimal TicketPriceAvg { get; set; }
    }
}
