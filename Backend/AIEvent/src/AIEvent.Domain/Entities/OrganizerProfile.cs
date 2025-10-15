using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public partial class OrganizerProfile : BaseEntity
    {
        public Guid UserId { get; set; }
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

        public string? ImgCompany { get; set; }
        public string? ImgFrontIdentity { get; set; }
        public string? ImgBackIdentity { get; set; }
        public string? ImgBusinessLicense { get; set; }

        public string? IdentityNumber { get; set; }

        public string? CompanyName { get; set; }
        public string? TaxCode { get; set; }
        public string? CompanyDescription { get; set; }

        public ConfirmStatus Status { get; set; } = ConfirmStatus.NeedConfirm;
        public DateTime? ConfirmAt { get; set; }
        public string? ConfirmBy { get; set; }

        public User User { get; set; } = default!;
        public ICollection<Event>? Events { get; set; }
    }
}
