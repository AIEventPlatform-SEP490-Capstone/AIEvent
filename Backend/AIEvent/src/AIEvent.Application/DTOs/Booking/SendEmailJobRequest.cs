using AIEvent.Application.DTOs.Common;

namespace AIEvent.Application.DTOs.Booking
{
    public class SendEmailJobRequest
    {
        public required string Email { get; set; }
        public required string FullName { get; set; }
        public required string EventTitle { get; set; }
        public required List<TicketForPdf> Tickets { get; set; }
        public required string OrganizerName { get; set; }
        public required string OrganizerPhone { get; set; }
        public required string OrganizerEmail { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}
