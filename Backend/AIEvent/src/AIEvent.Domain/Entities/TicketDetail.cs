using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class TicketDetail : BaseEntity
    {
        public Guid EventId { get; set; }
        public required string TicketName { get; set; }
        public required decimal TicketPrice { get; set; }
        public required int TicketQuantity { get; set; }
        public int RemainingQuantity { get; set; }
        public string? TicketDescription { get; set; }
        public virtual Event Event { get; set; } = default!;
    }
}
