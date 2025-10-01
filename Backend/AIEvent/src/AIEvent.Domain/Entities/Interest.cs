using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class Interest : BaseEntity
    {
        public required string Name { get; set; }
        public ICollection<UserInterest> UserInterests { get; set; } = new List<UserInterest>();
    }
}
