using Microsoft.AspNetCore.Identity;

namespace AIEvent.Domain.Identity
{
    public class AppRole : IdentityRole<Guid>
    {
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
