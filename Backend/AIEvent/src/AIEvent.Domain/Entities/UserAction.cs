using AIEvent.Domain.Base;
using AIEvent.Domain.Identity;

namespace AIEvent.Domain.Entities
{
    public partial class UserAction : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid EventId { get; set; }
        public string ActionType { get; set; } = string.Empty; 
        public string? Keyword { get; set; }
        public int Count { get; set; }
        public AppUser AppUser { get; set; } = default!;
        public ICollection<UserActionFilter> Filters { get; set; } = new List<UserActionFilter>();
    }
}
