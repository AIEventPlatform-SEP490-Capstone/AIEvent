
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class EndEventReview
    {
        public Guid EndEventRequestId { get; set; }
        public ConfirmEventStatus Status { get; set; }
        public string? Summary { get; set; }
        public string? AdminNote { get; set; }
        public List<string> EvidenceImages { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? ReviewedAt { get; set; }

        public Guid EventId { get; set; }
        public string EventTitle { get; set; } = default!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? PlatformFee { get; set; }
        public decimal? PayoutAmount { get; set; }

        public string OrganizerName { get; set; } = default!;
        public string ContactEmail { get; set; } = default!;
        public string ContactPhone { get; set; } = default!;

        public string BankName { get; set; } = default!;
        public string AccountHolderName { get; set; } = default!;
        public string AccountNumber { get; set; } = default!;
    }
}
