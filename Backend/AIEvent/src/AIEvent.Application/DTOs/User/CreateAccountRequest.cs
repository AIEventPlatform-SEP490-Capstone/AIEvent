using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.User
{
    public class CreateAccountRequest
    {
        [Required(ErrorMessage = "Full name is required")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string Email { get; set; } = string.Empty;
        public required string Password { get; set; }
        [Phone(ErrorMessage = "Invalid phone number format")]
        public required string PhoneNumber { get; set; }
        public string? Address { get; set; }
        public IFormFile? Image { get; set; }
    }
}
