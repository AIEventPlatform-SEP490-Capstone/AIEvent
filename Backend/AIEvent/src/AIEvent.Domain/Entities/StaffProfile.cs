using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public class StaffProfile : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid OrganizerProfileId { get; set; }
        public User User { get; set; } = default!;
        public OrganizerProfile OrganizerProfile { get; set; } = default!;
    }
}
