using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class EndEventReviews
    {
        public Guid EndEventRequestId { get; set; }
        public EndEventStatus Status { get; set; }
        public string? Summary { get; set; }
        public string? AdminNote { get; set; }
        public List<string> EvidenceImages { get; set; } = new();
        public DateTimeOffset CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }

        public Guid EventId { get; set; }
        public string EventTitle { get; set; } = default!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? PlatformFee { get; set; }
        public decimal? PayoutAmount { get; set; }

        public string OrganizerName { get; set; } = default!;
    }
}
