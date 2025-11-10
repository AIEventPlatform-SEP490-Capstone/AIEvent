using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.InviteFriend
{
    public class InviteFriendResponse
    {
        public Guid InvitationId { get; set; }
        public Guid EventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public string? EventImage { get; set; }
        public Guid InviterId { get; set; }
        public string InviteName { get; set; } = string.Empty;
        public string InviteEmail { get; set; } = string.Empty;
        public Guid? InvitedUserId { get; set; }
        public string InvitedUserName { get; set; } = string.Empty;
        public string InvitedUserEmail { get; set; } = string.Empty;
        public string? Message { get; set; }
        public InvitationStatus Status { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
    }
}
