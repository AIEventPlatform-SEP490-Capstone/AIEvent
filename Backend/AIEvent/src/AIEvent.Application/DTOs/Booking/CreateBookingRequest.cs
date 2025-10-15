namespace AIEvent.Application.DTOs.Booking
{
    public class CreateBookingRequest
    {
        public Guid EventId { get; set; }
        public required List<TicketTypeRequest> TicketTypeRequests { get; set; }
    }
}
