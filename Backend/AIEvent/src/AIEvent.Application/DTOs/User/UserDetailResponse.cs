using AIEvent.Application.DTOs.Common;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.User
{
    public class UserDetailResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public List<UserInterest>? UserInterests { get; set; }
        public List<InterestedCities>? InterestedCities { get; set; }
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public string? AvatarImgUrl { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; } = false;
        public bool? IsPushNotificationEnabled { get; set; } = false;
        public bool? IsSmsNotificationEnabled { get; set; } = false;
        public List<FavoriteEventTypes>? FavoriteEventTypes { get; set; }
        public string? Occupation { get; set; }
        public string? JobTitle { get; set; }
        public string? CareerGoal { get; set; }
        public ExperienceLevel? Experience { get; set; } = ExperienceLevel.None;
        public string? PersonalWebsite { get; set; }
        public string? Introduction { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public List<UserSkills>? ProfessionalSkills { get; set; }
        public List<UserLanguages>? Languages { get; set; }
        public int TotalJoinedEvents { get; set; }   
        public int TotalFavoriteEvents { get; set; }  
        public int TotalFriends { get; set; }       
    }
}
