using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Booking
{
    public class CheckInforResponse
    {
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public required string EventName { get; set; }
        public required string TicketCode { get; set; }
        public required string TicketTypeName { get; set; }
        public required TicketStatus Status { get; set; }
    }
}
