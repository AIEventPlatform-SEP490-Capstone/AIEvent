using AIEvent.Application.DTOs.Tag;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class EventsLocationResponse
    {
        public Guid EventId { get; set; }
        public required string EventCategoryName { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public string? LocationName { get; set; }
        public int TotalTickets { get; set; }
        public int SoldQuantity { get; set; }
        public decimal TicketPrice { get; set; }
        public bool? Publish { get; set; }
        public EventStatus? Status { get; set; }
        public List<TagResponse>? Tags { get; set; }
        public List<string>? ImgListEvent { get; set; }
        public bool? IsFavorite { get; set; }
        public TicketPricingType TicketPricingType { get; set; }
        public double? AverageRating { get; set; }
        public int TotalRatings { get; set; }
        public int FavoriteCount { get; set; }
        public DateTime? SaleStartTime { get; set; }
        public DateTime? SaleEndTime { get; set; }
        public double Latitude { get; set; } 
        public double Longitude { get; set; } 
    }
}
