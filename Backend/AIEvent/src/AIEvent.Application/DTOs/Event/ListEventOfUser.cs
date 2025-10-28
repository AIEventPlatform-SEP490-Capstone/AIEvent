using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class ListEventOfUser
    {
        public Guid EventId { get; set; }
        public required string Title { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public string? Address { get; set; }
        public int TotalTickets { get; set; }
        public string? Image { get; set; }
    }
}
