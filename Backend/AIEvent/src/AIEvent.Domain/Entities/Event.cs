using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class Event : BaseEntity
    {
        public Guid OrganizerProfileId { get; set; }
        public Guid VenueId { get; set; }
        public Guid CategoryId { get; set; }
        public required string Title { get; set; }

        public virtual Venue? Venue { get; set; } 
        public virtual EventCategory? EventCategory { get; set; }
        public virtual OrganizerProfile? OrganizerProfile { get; set; }
        
        public virtual ICollection<EventTag> EventTags { get; set; } = new List<EventTag>();
        public virtual ICollection<EventFieldAssignment> EventFieldAssignments { get; set; } = new List<EventFieldAssignment>();
    }
}
