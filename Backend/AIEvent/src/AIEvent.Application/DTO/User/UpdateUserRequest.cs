using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTO.User
{
    public class UpdateUserRequest
    {
        [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public string? FullName { get; set; }

        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? PhoneNumber { get; set; }
    }
}
