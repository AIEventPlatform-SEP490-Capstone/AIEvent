using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace AIEvent.Application.DTOs.Organizer
{
    public class RegisterOrganizerRequest
    {
        public required OrganizationType OrganizationType { get; set; }
        public required EventFrequency EventFrequency { get; set; }
        public required EventSize EventSize { get; set; }
        public required OrganizerType OrganizerType { get; set; }
        public required EventExperienceLevel EventExperienceLevel { get; set; }
        public required string ContactName { get; set; }
        public required string ContactEmail { get; set; }
        public required string ContactPhone { get; set; }
        public required string Address { get; set; }
        public string? Website { get; set; }
        public string? UrlFacebook { get; set; }
        public string? UrlInstagram { get; set; }
        public string? UrlLinkedIn { get; set; }
        public string? ExperienceDescription { get; set; }

        public string? IdentityNumber { get; set; }

        public string? CompanyName { get; set; }
        public string? TaxCode { get; set; }
        public string? CompanyDescription { get; set; }

        public List<OrganizerFieldRequest>? OrganizerFields { get; set; }

        public IFormFile? ImgFrontIdentity { get; set; }
        public IFormFile? ImgBackIdentity { get; set; }
        public IFormFile? ImgBusinessLicense { get; set; }
    }
}
