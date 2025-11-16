namespace AIEvent.Application.DTOs.Dashboard
{
    public class PendingEventResponse
    {
        public Guid EventId { get; set; }
        public required string Title { get; set; }
        public string? EventImg { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}

