using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Organizer
{
    public class EventFlagResponse
    {
        public Guid EventId { get; set; }
        public required string Title { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? LocationName { get; set; }
        public EventStatus? Status { get; set; }
        public string? ReasonCancel { get; set; }
        public DateTimeOffset? CreatedAt { get; set; }
    }
}

