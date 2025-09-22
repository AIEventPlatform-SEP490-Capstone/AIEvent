namespace AIEvent.Domain.Entities
{
    public partial class EventTag
    {
        public Guid EventId { get; set; }
        public Guid TagId { get; set; }
        public required Event Event { get; set; }
        public required Tag Tag { get; set; }
    }
}
