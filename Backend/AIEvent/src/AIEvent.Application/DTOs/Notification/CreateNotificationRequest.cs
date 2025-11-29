using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Notification
{
    public class CreateNotificationRequest
    {
        public Guid? UserId { get; set; }
        public string Title { get; set; } = default!;
        public string Message { get; set; } = default!;
        public string? ImageUrl { get; set; }
        public Guid? EventId { get; set; }
        public Guid? EventInvitationId { get; set; }
        public Guid? OrganizerProfileId { get; set; }
        public NotificationType Type { get; set; } = NotificationType.System; 
    }
}
