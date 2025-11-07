namespace AIEvent.Application.DTOs.Friend
{
    public class ListFriendResponse
    {
        public Guid Id { get; set; }
        public required string FriendName {  get; set; }
        public string? Image { get; set;}
        public string? District { get; set; }
        public string? InterestsJson { get; set; }
        public int EventNumber { get; set; }
    }
}
