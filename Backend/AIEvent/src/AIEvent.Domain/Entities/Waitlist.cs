using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class Waitlist : BaseEntity
    {
        public Guid EventId { get; set; }
        public Guid? TicketDetailId { get; set; }
        public Guid UserId { get; set; }
        public bool IsNotified { get; set; }
        public WaitlistStatus Status { get; set; } = WaitlistStatus.Waiting;
    }
}
