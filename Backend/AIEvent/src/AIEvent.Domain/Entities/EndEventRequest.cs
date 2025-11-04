using AIEvent.Domain.Base;
using AIEvent.Domain.Enums; 

namespace AIEvent.Domain.Entities
{
    public class EndEventRequest : BaseEntity
    {
        public Guid OrganizerProfileId { get; set; }
        public Guid EventId { get; set; }
        public Guid PaymentInformationId { get; set; }
        public string? Summary { get; set; }
        public string? AdminNote { get; set; }
        public string? EvidenceImages { get; set; }
        public ConfirmEventStatus Status { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public bool IsLatest { get; set; }
        public virtual OrganizerProfile OrganizerProfile { get; set; } = default!;
        public virtual PaymentInformation PaymentInformation { get; set; } = default!;
        public virtual Event Event { get; set; } = default!;
    }
}
