using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class Tag : BaseEntity
    {
        public required string NameTag { get; set; }
        public ICollection<EventTag>? EventTags { get; set; }
    }
}
