namespace AIEvent.Application.DTOs.Event
{
    public class EventsRelatedResponse
    {
        public Guid EventId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public decimal MinTicketPrice { get; set; }
        public decimal MaxTicketPrice { get; set; }
        public List<string>? ImgListEvent { get; set; }
    }
}
