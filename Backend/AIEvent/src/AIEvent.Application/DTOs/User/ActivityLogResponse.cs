namespace AIEvent.Application.DTOs.User
{
    public class ActivityLogResponse
    {
        public Guid Id { get; set; }
        public string Path { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string? Query { get; set; }
        public string? Body { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public int StatusCode { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
