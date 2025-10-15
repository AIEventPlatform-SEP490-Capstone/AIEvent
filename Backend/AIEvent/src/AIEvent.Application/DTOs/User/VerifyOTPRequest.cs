using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.User
{
    public class VerifyOTPRequest
    {
        [Required]
        public required string Email { get; set; }
        [Required]
        public required string OTPCode { get; set; }
    }
}
