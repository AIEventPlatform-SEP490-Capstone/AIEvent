namespace AIEvent.Application.DTOs.Notification
{
    public class CreateNotificationToAllRequest : CreateNotificationRequest
    {
        public List<Guid>? TargetRoles { get; set; }
    }
}
