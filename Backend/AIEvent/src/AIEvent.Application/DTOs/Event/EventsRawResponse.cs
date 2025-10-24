using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class EventsRawResponse
    {
        public Guid EventId { get; set; }
        public required string EventCategoryName { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public string? LocationName { get; set; }
        public decimal? Price { get; set; }
        public int? TotalPerson { get; set; }
        public int? TotalPersonJoin { get; set; }
        public List<string>? ImgListEvent { get; set; }
        public TicketType TicketType { get; set; }
        public ConfirmStatus? Status { get; set; }
        public string? OrganizedBy { get; set; }
    }
}
