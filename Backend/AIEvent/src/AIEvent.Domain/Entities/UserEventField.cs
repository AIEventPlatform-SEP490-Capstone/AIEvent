using AIEvent.Domain.Identity;

namespace AIEvent.Domain.Entities
{
    public partial class UserEventField
    {
        public Guid UserId { get; set; }
        public AppUser User { get; set; } = default!;

        public Guid EventFieldId { get; set; }
        public EventField EventField { get; set; } = default!;
    }
}
