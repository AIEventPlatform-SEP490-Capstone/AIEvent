namespace AIEvent.Application.DTOs.Event
{
    public class CancelEventNotificationRequest
    {
        public Guid EventId { get; set; }
        public Guid OrganizerUserId { get; set; }
        public Guid OrganizerProfileId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public string? ReasonCancel { get; set; }
        public string? FirstImage { get; set; }
        public string? OrganizerEmail { get; set; }
        public string? OrganizerFullName { get; set; }
        public bool IsEmailNotificationEnabled { get; set; }
    }
}

