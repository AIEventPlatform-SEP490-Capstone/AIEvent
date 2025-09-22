namespace AIEvent.Domain.Entities
{
    public class OrganizerFieldAssignment
    {
        public Guid OrganizerProfileId { get; set; }
        public OrganizerProfile OrganizerProfile { get; set; } = default!;

        public Guid EventFieldId { get; set; }
        public EventField EventField { get; set; } = default!;
    }
}
