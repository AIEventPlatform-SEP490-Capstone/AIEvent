namespace AIEvent.Application.DTOs.Friend
{
    public class AddFriendResponse
    {
        public required string SenderId { get; set; }
        public required bool IsAccepted { get; set; }
    }
}
