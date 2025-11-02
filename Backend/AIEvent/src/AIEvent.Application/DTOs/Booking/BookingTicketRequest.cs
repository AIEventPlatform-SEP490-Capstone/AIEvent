namespace AIEvent.Application.DTOs.Booking
{
    public class BookingTicketRequest
    {
        public Guid TicketTypeId { get; set; }
        public int Quantity { get; set; }
    }
}
