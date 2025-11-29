using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Notification
{
    public class NotificationResponse
    {
        public Guid? NotificationId { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public bool IsRead { get; set; }
        public Guid? EventInvitationId { get; set; }
        public Guid? OrganizerProfileId { get; set; }
        public DateTime? ReadAt { get; set; }
        public string? ImageUrl { get; set; }
        public NotificationType Type { get; set; }
        public DateTimeOffset CreatedTime { get; set; }
        public Guid? EventId { get; set; } = Guid.Empty;
    }
}
