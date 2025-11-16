namespace AIEvent.Application.DTOs.Dashboard
{
    public class UserManagementResponse
    {
        public Guid UserId { get; set; }
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string RoleName { get; set; }
        public int TotalEventsParticipated { get; set; }
        public int? TotalEventsOrganized { get; set; }
        public string? AvatarUrl { get; set; }
    }
}

