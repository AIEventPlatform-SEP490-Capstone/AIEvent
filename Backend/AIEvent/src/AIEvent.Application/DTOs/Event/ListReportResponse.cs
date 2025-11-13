using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class ListReportResponse
    {
        public Guid Id { get; set; }
        public required string UserName { get; set; }
        public required string UserEmail { get; set; }
        public EventReportType Type { get; set; }
        public required string Reason { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
