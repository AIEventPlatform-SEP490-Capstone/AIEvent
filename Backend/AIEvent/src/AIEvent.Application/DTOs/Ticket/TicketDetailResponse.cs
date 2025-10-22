namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketDetailResponse
    {
        public Guid TicketDetailId { get; set; }
        public Guid? RefundRuleId { get; set; }
        public required string TicketName { get; set; }
        public required decimal TicketPrice { get; set; }
        public int TicketQuantity { get; set; }
        public int SoldQuantity { get; set; }
        public int RemainingQuantity { get; set; }
        public string? TicketDescription { get; set; }
        public int MinPurchaseQuantity { get; set; } = 1; 
        public int MaxPurchaseQuantity { get; set; } = 10;
    }
}
