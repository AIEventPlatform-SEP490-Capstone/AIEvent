using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace AIEvent.Domain.Identity
{
    public class AppUser : IdentityUser<Guid>
    {
        public string? FullName { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; } = true;
        public bool? IsPushNotificationEnabled { get; set; } = true;
        public bool? IsSmsNotificationEnabled { get; set; } = true;
        public string? InterestedCitiesJson { get; set; }
        public string? AvatarImgUrl { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public OrganizerProfile? OrganizerProfile { get; set; }
        public ICollection<UserAction> UserActions { get; set; } = new List<UserAction>();
        public ICollection<UserInterest> UserInterests { get; set; } = new List<UserInterest>();
        public ICollection<FavoriteEvent> FavoriteEvents { get; set; } = new List<FavoriteEvent>();
    }
}
