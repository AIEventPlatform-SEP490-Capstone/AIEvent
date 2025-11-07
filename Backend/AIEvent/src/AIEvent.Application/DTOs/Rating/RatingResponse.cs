namespace AIEvent.Application.DTOs.Rating
{
    public class RatingResponse
    {
        public Guid RatingId { get; set; }
        public string? UserName { get; set; } 
        public byte RatingScore { get; set; }
        public string? Comment { get; set; }
        public DateTimeOffset CreateAt { get; set; }    
    }
}
