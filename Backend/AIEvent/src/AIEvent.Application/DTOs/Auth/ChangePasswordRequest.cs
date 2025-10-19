using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Auth
{
    public class ChangePasswordRequest
    {
        [Required(ErrorMessage = "Current password is required")]
        public required string CurrentPassword { get; set; }
        [Required(ErrorMessage = "New password is required")]
        public required string NewPassword { get; set; }

        [Required(ErrorMessage = "Confirm new password is required")]
        [Compare("NewPassword", ErrorMessage = "Password and confirm password do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
