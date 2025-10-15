using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class User : BaseEntity
    {
        public Guid RoleId { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? PasswordHash { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public bool IsActive { get; set; } = true;
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; } = true;
        public bool? IsPushNotificationEnabled { get; set; } = true;
        public bool? IsSmsNotificationEnabled { get; set; } = true;
        public string? InterestedCitiesJson { get; set; }
        public string? AvatarImgUrl { get; set; }
        public string? UserInterestsJson { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
        public OrganizerProfile? OrganizerProfile { get; set; }
        public Wallet Wallet { get; set; } = default!;
        public Role Role { get; set; } = default!;
        public ICollection<UserAction> UserActions { get; set; } = new List<UserAction>();
        public ICollection<UserOtps> UserOtps { get; set; } = new List<UserOtps>();
        public ICollection<FavoriteEvent> FavoriteEvents { get; set; } = new List<FavoriteEvent>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
    }
}
