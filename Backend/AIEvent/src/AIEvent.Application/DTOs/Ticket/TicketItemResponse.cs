using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketItemResponse
    {
        public Guid TicketId { get; set; }
        public string TicketCode { get; set; } = null!;
        public TicketStatus Status { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
