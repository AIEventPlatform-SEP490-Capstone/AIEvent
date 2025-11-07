namespace AIEvent.Application.DTOs.Friend
{
    public class ListAddFriendRequest
    {
        public Guid Id { get; set; }
        public required string SenderName { get; set; }
        public string? SenderAvatar { get; set; }
        public DateTimeOffset SentDate { get; set; }
    }
}
