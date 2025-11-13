using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class ReportResponse
    {
        public required string UserName { get; set; }
        public required string UserEmail { get; set; }
        public EventReportType Type { get; set; }
        public required string Reason { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? Reply { get; set; }
        public DateTimeOffset? CreatedAt { get; set; }
    }
}
