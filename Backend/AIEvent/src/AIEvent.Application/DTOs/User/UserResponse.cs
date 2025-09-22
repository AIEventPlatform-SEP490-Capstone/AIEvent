namespace AIEvent.Application.DTO.User
{
    public class UserResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public List<string> Roles { get; set; } = [];
        public bool EmailConfirmed { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UserOrganizerResponse
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
    }
}
