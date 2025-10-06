using AIEvent.Domain.Identity;

namespace AIEvent.Domain.Entities
{
    public class FavoriteEvent
    {
        public Guid UserId { get; set; }
        public Guid EventId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public AppUser User { get; set; } = default!;
        public Event Event { get; set; } = default!;
    }
}
