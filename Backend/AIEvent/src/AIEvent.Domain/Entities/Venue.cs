using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class Venue : BaseEntity
    {
        public string? City { get; set; }
        public required string Address { get; set; }
        public float Latitude { get; set; }
        public float Longitude { get; set; }

        public ICollection<Event>? Events { get; set; }
    }
}
