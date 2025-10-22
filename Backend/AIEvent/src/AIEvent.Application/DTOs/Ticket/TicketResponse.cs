using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketResponse
    {
        public Guid TicketId { get; set; }
        public required string EventName { get; set; }
        public required string Address { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? EventImage { get; set; }
        public TicketStatus Status { get; set; }
    }
}
