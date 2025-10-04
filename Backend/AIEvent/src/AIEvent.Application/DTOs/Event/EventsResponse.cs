using AIEvent.Application.DTOs.Tag;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class EventsResponse
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
        public List<TagResponse>? Tags { get; set; }
        public List<string>? ImgListEvent { get; set; }
        public TicketType TicketType { get; set; }
    }
}
