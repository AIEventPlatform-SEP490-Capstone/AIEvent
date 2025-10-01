using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class EventCategory : BaseEntity
    {
        public required string CategoryName { get; set; }
        public ICollection<Event>? Events { get; set; }
    }
}
