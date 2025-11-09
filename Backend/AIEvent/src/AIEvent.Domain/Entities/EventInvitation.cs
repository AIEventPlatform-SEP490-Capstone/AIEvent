using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class EventInvitation : BaseEntity
    {
        public Guid EventId { get; set; }
        public Guid InviterId { get; set; }
        public Guid? InvitedUserId { get; set; }
        public string? Message { get; set; }
        public InvitationStatus? Status { get; set; } = InvitationStatus.Pending;
        public DateTime? RespondedAt { get; set; }
        public virtual Event Event { get; set; } = default!;
        public virtual User Inviter { get; set; } = default!;
        public virtual User? InvitedUser { get; set; }
    }
}
