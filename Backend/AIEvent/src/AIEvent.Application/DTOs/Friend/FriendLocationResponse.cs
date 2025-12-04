namespace AIEvent.Application.DTOs.Friend
{
    public class FriendLocationResponse
    {
        public Guid FriendId { get; set; }
        public required string FriendName { get; set;}
        public string? ImageUrl { get; set;}
        public required string Email { get; set;}
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
