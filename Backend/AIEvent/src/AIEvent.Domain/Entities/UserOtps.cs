using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class UserOtps : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = default!;
        public string Code { get; set; } = null!;
        public PurposeStatus Purpose { get; set; }
        public DateTime ExpiredAt { get; set; }
    }
}
