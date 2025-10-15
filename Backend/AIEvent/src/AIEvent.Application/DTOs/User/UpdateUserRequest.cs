using AIEvent.Application.DTOs.Common;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.User
{
    public class UpdateUserRequest
    {
        [Required(ErrorMessage = "Full name is required")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        public string Email { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }
        public List<UserInterest>? UserInterests { get; set; }
        public List<InterestedCities>? InterestedCities { get; set; }
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public IFormFile? AvatarImg { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; } = false;
        public bool? IsPushNotificationEnabled { get; set; } = false;
        public bool? IsSmsNotificationEnabled { get; set; } = false;
    }
}
