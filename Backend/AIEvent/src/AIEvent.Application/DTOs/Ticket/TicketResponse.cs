using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketResponse
    {
        public Guid TicketId { get; set; }
        public string TicketCode { get; set; } = default!;
        public string TicketTypeName { get; set; } = default!;
        public decimal Price { get; set; }
        public string Status { get; set; } = default!;
        public string? QrCode { get; set; }
    }
}
