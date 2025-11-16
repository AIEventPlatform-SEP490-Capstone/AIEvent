namespace AIEvent.Application.DTOs.Dashboard
{
    public class NewUserResponse
    {
        public Guid UserId { get; set; }
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public string? ImgProfile { get; set; }
        public required string RoleName { get; set; }
    }
}

