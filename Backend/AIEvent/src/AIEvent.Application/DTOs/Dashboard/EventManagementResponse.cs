using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Dashboard
{
    public class EventManagementResponse
    {
        public Guid EventId { get; set; }
        public required string Title { get; set; }
        public string? OrganizerName { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public string? ImageUrl { get; set; }
        public int ParticipantCount { get; set; }
        public EventStatus? Status { get; set; }
    }
}

