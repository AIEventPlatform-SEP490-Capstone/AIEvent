namespace AIEvent.Domain.Entities
{
    public partial class TicketDetail
    {
        public Guid Id { get; set; }
        public Guid EventId { get; set; }
        public Guid? RefundRuleId { get; set; }
        public required string TicketName { get; set; }
        public decimal TicketPrice { get; set; }
        public required int TicketQuantity { get; set; }
        public int SoldQuantity { get; set; } = 0;
        public int RemainingQuantity { get; set; }
        public string? TicketDescription { get; set; }
        public int MinPurchaseQuantity { get; set; } = 1; 
        public int MaxPurchaseQuantity { get; set; } = 10;
        public virtual Event Event { get; set; } = default!;
        public virtual RefundRule? RefundRule { get; set; } = default!;
        public ICollection<BookingItem> BookingItems { get; set; } = new List<BookingItem>();
        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public string? CreatedBy { get; set; }
        public string? UpdatedBy { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }

        public void SetCreated(string? userId = null)
        {
            CreatedBy = userId;
            CreatedAt = DateTimeOffset.UtcNow;
            UpdatedAt = DateTimeOffset.UtcNow;
        }

        public void SetUpdated(string? userId = null)
        {
            UpdatedBy = userId;
            UpdatedAt = DateTimeOffset.UtcNow;
        }
    }
}
