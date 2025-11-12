using AIEvent.Application.DTOs.Event;

namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketByEventResponse
    {
        public required string TicketTypeName { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
