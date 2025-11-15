using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Notification
{
    public class PushNotificationRequest
    {
        public Guid? UserId { get; set; }       
        public string Title { get; set; } = default!;
        public string Content { get; set; } = default!;
        public string? ImageUrl { get; set; }   
        public Guid? EventId { get; set; } 
        public NotificationType Type { get; set; }
        public NotificationChannel Channel { get; set; } 
    }
}
