using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class User : BaseEntity
    {
        public Guid RoleId { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? PasswordHash { get; set; }
        public string? Address { get; set; }
        public string? District { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public bool IsActive { get; set; } = false;
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; } = true;
        public bool? IsPushNotificationEnabled { get; set; } = true;
        public bool? IsSmsNotificationEnabled { get; set; } = true;
        public bool? IsTurnOnLocation { get; set; } = false;
        public string? InterestedDistrictsJson { get; set; }
        public string? AvatarImgUrl { get; set; }
        public string? UserInterestsJson { get; set; }
        public string? FavoriteEventTypesJson { get; set; }
        public string? Occupation { get; set; }
        public string? JobTitle { get; set; }
        public string? CareerGoal { get; set; }
        public ExperienceLevel? Experience { get; set; }
        public string? PersonalWebsite { get; set; }
        public string? Introduction { get; set; }
        public string? ProfessionalSkillsJson { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public string? DeviceToken { get; set; }
        public string? LanguagesJson { get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        public OrganizerProfile? OrganizerProfile { get; set; }
        public StaffProfile? StaffProfile { get; set; }
        public Wallet Wallet { get; set; } = default!;
        public Role Role { get; set; } = default!;
        public ICollection<FavoriteEvent> FavoriteEvents { get; set; } = new List<FavoriteEvent>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
        public ICollection<PaymentTransaction> PaymentTransactions { get; set; } = new List<PaymentTransaction>();
        public ICollection<PaymentInformation> PaymentInformations { get; set; } = new List<PaymentInformation>(); 
        public ICollection<Friendship> FriendshipsSent { get; set; } = new List<Friendship>();
        public ICollection<Friendship> FriendshipsReceived { get; set; } = new List<Friendship>();
        public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<EventInvitation> SentInvitations { get; set; } = new List<EventInvitation>();
        public virtual ICollection<EventInvitation> ReceivedInvitations { get; set; } = new List<EventInvitation>();
        public virtual ICollection<EventReport> EventReports { get; set; } = new List<EventReport>();
    }
}
