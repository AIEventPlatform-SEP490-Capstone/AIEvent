namespace AIEvent.Application.DTOs.AIRecommendation
{
    public class SessionResponse
    {
        public Guid SessionId { get; set; }
        public string? SessionName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastMessageAt { get; set; }
        public int MessageCount { get; set; }
    }
}

