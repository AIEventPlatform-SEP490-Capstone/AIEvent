namespace AIEvent.Domain.Entities
{
    public partial class EventTag
    {
        public Guid EventId { get; set; }
        public Guid TagId { get; set; }
        public Event Event { get; set; } = default!;
        public Tag Tag { get; set; } = default!;
    }
}
