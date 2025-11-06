using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class Friendship : BaseEntity
    {
        public Guid SenderId { get; set; }       
        public Guid ReceiverId { get; set; }     
        public FriendshipStatus Status { get; set; }
        public User Sender { get; set; } = default!;
        public User Receiver { get; set; } = default!;
    }
}
