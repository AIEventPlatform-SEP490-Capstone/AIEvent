using AIEvent.Application.DTOs.Common;
using AIEvent.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Auth
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Full name is required")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Confirm password is required")]
        [Compare("Password", ErrorMessage = "Password and confirm password do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }
        public List<UserEventFieldRequest>? UserEventFields { get; set; }
        public List<InterestedCities>? InterestedCities { get; set; }
        public ParticipationFrequency ParticipationFrequency { get; set; }
        public BudgetOption BudgetOption { get; set; }
        public bool? IsEmailNotificationEnabled { get; set; } = false;
        public bool? IsPushNotificationEnabled { get; set; } = false;
        public bool? IsSmsNotificationEnabled { get; set; } = false;
    }
}
