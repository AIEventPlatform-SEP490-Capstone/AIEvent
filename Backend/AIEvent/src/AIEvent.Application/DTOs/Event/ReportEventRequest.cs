using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class ReportEventRequest
    {
        public required string EventId { get; set; }
        public required EventReportType Type { get; set; }
        public required string Reason { get; set; }
        public string? AttachmentUrl { get; set; }
    }
}
