using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public class Role : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public virtual ICollection<User> Users { get; set; } = new List<User>();
    }
}
