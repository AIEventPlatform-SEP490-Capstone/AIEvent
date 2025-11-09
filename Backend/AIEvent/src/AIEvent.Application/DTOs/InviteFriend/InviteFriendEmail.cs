namespace AIEvent.Application.DTOs.InviteFriend
{
    public class InviteFriendEmail
    {
        public Guid InvitedUserId { get; set; }
        public string InvitedUserEmail { get; set; } = string.Empty;
        public string InvitedUserFullName { get; set; } = string.Empty;

        public Guid InviterId { get; set; }
        public string InviterFullName { get; set; } = string.Empty;

        public Guid EventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public string? EventFirstImage { get; set; }

        public string? Message { get; set; }
    }
}
