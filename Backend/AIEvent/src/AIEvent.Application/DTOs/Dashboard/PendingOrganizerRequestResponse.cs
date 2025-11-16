namespace AIEvent.Application.DTOs.Dashboard
{
    public class PendingOrganizerRequestResponse
    {
        public Guid OrganizerId { get; set; }
        public required string ContactName { get; set; }
        public string? CompanyName { get; set; }
        public string? CompanyImg { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}

