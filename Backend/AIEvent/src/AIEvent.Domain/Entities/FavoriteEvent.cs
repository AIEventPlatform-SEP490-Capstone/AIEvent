namespace AIEvent.Domain.Entities
{
    public class FavoriteEvent
    {
        public Guid UserId { get; set; }
        public Guid EventId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public User User { get; set; } = default!;
        public Event Event { get; set; } = default!;
    }
}
