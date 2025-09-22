using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace AIEvent.Domain.Identity
{
    public class AppUser : IdentityUser<Guid>
    {
        public string? FullName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; }
        public bool? IsPushNotificationEnabled { get; set; }
        public bool? IsSmsNotificationEnabled { get; set; }
        public string? InterestedCitiesJson { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public OrganizerProfile? OrganizerProfile { get; set; }
        public ICollection<UserEventField> UserEventFields { get; set; } = new List<UserEventField>();
    }
}
