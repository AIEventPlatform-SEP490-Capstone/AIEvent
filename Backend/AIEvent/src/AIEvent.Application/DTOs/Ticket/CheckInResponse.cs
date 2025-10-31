using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Ticket
{
    public class CheckInResponse
    {
        public required string TicketCode { get; set; }
        public required string FullName { get; set; }
        public required string EventName { get; set; }
        public required string TicketTypeName { get; set; }
        public required TicketStatus Status { get; set; }
        public required DateTime CheckInAt { get; set; }
    }
}
