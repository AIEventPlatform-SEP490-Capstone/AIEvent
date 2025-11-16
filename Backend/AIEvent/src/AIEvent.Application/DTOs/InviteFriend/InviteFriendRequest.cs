namespace AIEvent.Application.DTOs.InviteFriend
{
    public class InviteFriendRequest
    {
        public List<Guid>? InvitedUserIds { get; set; }
        public string? Message { get; set; }
    }
}
