namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketDetailRequest
    {
        public required string TicketName { get; set; }
        public required decimal TicketPrice { get; set; }
        public int TicketQuantity { get; set; }
        public string? TicketDescription { get; set; }
    }
}
