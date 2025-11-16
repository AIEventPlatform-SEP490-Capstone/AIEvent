using AIEvent.Domain.Base;
using AIEvent.Domain.Enums; 

namespace AIEvent.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public Guid UserId { get; set; } 
        public string Title { get; set; } = default!; 
        public string Message { get; set; } = default!;
        public NotificationType Type { get; set; } 
        public Guid? EventId { get; set; }
        public string? ImageUrl { get; set; } 
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }
        public virtual User User { get; set; } = default!; 
    }
}
