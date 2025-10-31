using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Organizer
{
    public class OrganizerResponse
    {
        public required string Id { get; set; }
        public required OrganizationType OrganizationType { get; set; }
        public string? CompanyName { get; set; }
        public required string ContactEmail { get; set; }
        public required string ContactPhone { get; set; }
        public required string Address { get; set; }
        public string? ImgCompany { get; set; }
    }
}
