namespace AIEvent.Application.DTOs.AIRecommendation
{
    public class ChatLogResponse
    {
        public string Id { get; set; } = default!;
        public string Prompt { get; set; } = default!;
        public string Response { get; set; } = default!;
        public Guid Session { get; set; }
        public string? SessionName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

