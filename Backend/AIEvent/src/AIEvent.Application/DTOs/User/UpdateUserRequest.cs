using AIEvent.Application.DTOs.Common;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.User
{
    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public IFormFile? AvatarImg { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? Occupation { get; set; }
        public string? JobTitle { get; set; }
        public string? CareerGoal { get; set; }
        public ExperienceLevel? Experience { get; set; } = ExperienceLevel.None;
        public string? PersonalWebsite { get; set; }
        public string? Introduction { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; } = false;
        public bool? IsPushNotificationEnabled { get; set; } = false;
        public bool? IsSmsNotificationEnabled { get; set; } = false;
        public List<UserInterest>? UserInterests { get; set; }
        public List<InterestedCities>? InterestedCities { get; set; }
        public List<FavoriteEventTypes>? FavoriteEventTypes { get; set; }
        public List<UserSkills>? ProfessionalSkills { get; set; }
        public List<Languages>? Languages { get; set; }
    }
}
