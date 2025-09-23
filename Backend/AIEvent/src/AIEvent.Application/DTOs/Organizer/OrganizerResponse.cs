using AIEvent.Application.DTOs.User;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Organizer
{
    public class OrganizerResponse
    {
        public Guid OrganizerId { get; set; }
        public OrganizationType OrganizationType { get; set; }
        public EventFrequency EventFrequency { get; set; }
        public EventSize EventSize { get; set; }
        public OrganizerType OrganizerType { get; set; }
        public EventExperienceLevel EventExperienceLevel { get; set; }
        public string? ContactName { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string? Address { get; set; }
        public string? Website { get; set; }
        public string? UrlFacebook { get; set; }
        public string? UrlInstagram { get; set; }
        public string? UrlLinkedIn { get; set; }
        public string? ExperienceDescription { get; set; }

        public string? IdentityNumber { get; set; }

        public string? CompanyName { get; set; }
        public string? TaxCode { get; set; }
        public string? CompanyDescription { get; set; }

        public string? ImgCompany { get; set; }
        public string? ImgFrontIdentity { get; set; }
        public string? ImgBackIdentity { get; set; }
        public string? ImgBusinessLicense { get; set; }
        public required UserOrganizerResponse UserInfo { get; set; }
        public List<OrganizerFieldResponse>? OrganizerFields { get; set; }
    }
}
