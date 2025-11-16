using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Auth
{
    public class VerifyOtpRequest
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public required string Email { get; set; }
        public required string Otp { get; set; }
    }
}
