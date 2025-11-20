using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public class ActivityLog : BaseEntity
    {
        public Guid? UserId { get; set; }
        public string Path { get; set; } = default!;
        public string Method { get; set; } = default!;
        public string? Body { get; set; }
        public string? Query { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public int StatusCode { get; set; }
    }
}
