namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketByEventResponse
    {
        public required string TicketTypeName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }  
        public List<TicketItemResponse> Tickets { get; set; } = new();
    }
}
