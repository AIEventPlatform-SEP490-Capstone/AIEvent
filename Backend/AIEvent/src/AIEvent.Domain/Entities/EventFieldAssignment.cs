namespace AIEvent.Domain.Entities
{
    public partial class EventFieldAssignment
    {
        public Guid EventId { get; set; }
        public Event Event { get; set; } = default!;

        public Guid EventFieldId { get; set; }
        public EventField EventField { get; set; } = default!;
    }
}
