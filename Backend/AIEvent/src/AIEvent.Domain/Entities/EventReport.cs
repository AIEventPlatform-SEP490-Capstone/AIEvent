using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class EventReport : BaseEntity
    {
        public Guid EventId { get; set; }
        public Guid UserId { get; set; }
        public EventReportType Type { get; set; }
        public required string Reason { get; set; }
        public string? ResolutionNote { get; set;}
        public string? AttachmentUrl { get; set; }
        public Event Event { get; set; } = default!;
        public User User { get; set; } = default!;
    }
}
