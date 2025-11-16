using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.InviteFriend
{
    public class ConfirmInvitationEmail
    {
        public Guid InviterId { get; set; }
        public string InviterEmail { get; set; } = string.Empty;
        public string InviterFullName { get; set; } = string.Empty;

        public Guid InvitedUserId { get; set; }
        public string InvitedUserFullName { get; set; } = string.Empty;

        public Guid EventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public string? EventFirstImage { get; set; }

        public string? Message { get; set; }
        public ConfirmStatus Status { get; set; }
    }
}
