using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class TicketDetail : BaseEntity
    {
        public Guid EventId { get; set; }
        public Guid? RefundRuleId { get; set; }
        public required string TicketName { get; set; }
        public decimal TicketPrice { get; set; }
        public required int TicketQuantity { get; set; }
        public int SoldQuantity { get; set; } = 0;
        public int RemainingQuantity { get; set; }
        public string? TicketDescription { get; set; }
        public virtual Event Event { get; set; } = default!;
        public virtual RefundRule? RefundRule { get; set; } = default!;
        public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    }
}
