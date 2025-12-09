using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Organizer
{
    public class OrganizerWithFlagsResponse
    {
        public required string Id { get; set; }
        public required OrganizationType OrganizationType { get; set; }
        public string? CompanyName { get; set; }
        public string? ContactName { get; set; }
        public required string ContactEmail { get; set; }
        public required string ContactPhone { get; set; }
        public required string Address { get; set; }
        public string? ImgCompany { get; set; }
        public DateTimeOffset? CreatedAt { get; set; }
        public OrganizerProfileStatus? Status { get; set; }
        public int TotalEventFlags { get; set; }
        public bool IsBanned { get; set; }
        public List<EventFlagResponse> FlaggedEvents { get; set; } = new List<EventFlagResponse>();
    }
}

