using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class EventField : BaseEntity
    {
        public required string NameEventField { get; set; }
        public ICollection<UserEventField> UserEventFields { get; set; } = new List<UserEventField>();
        public ICollection<EventFieldAssignment> EventFieldAssignments { get; set; } = new List<EventFieldAssignment>();
        public ICollection<OrganizerFieldAssignment> OrganizerFieldAssignments { get; set; } = new List<OrganizerFieldAssignment>();
    }
}
