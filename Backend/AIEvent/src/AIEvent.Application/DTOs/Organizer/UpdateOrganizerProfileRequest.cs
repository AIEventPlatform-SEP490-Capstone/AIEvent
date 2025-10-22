using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace AIEvent.Application.DTOs.Organizer
{
    public class UpdateOrganizerProfileRequest
    {
        public string? ContactName { get; set; }
        public string? Address { get; set; }
        public string? Website { get; set; }
        public string? UrlFacebook { get; set; }
        public string? UrlInstagram { get; set; }
        public string? UrlLinkedIn { get; set; }
        public string? ExperienceDescription { get; set; }
        public string? CompanyDescription { get; set; }
        public IFormFile? ImgCompany { get; set; }

        public OrganizationType? OrganizationType { get; set; }
        public EventFrequency? EventFrequency { get; set; }
        public EventSize? EventSize { get; set; }
        public OrganizerType? OrganizerType { get; set; }
        public EventExperienceLevel? EventExperienceLevel { get; set; }
    }
}
