namespace AIEvent.Application.DTOs.Dashboard
{
    public class RecentActivityResponse
    {
        public Guid Id { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
