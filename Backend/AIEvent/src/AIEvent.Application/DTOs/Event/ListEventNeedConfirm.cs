using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class ListEventNeedConfirm
    {
        public required string EventId { get; set; }
        public required string Title { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public string? LocationName { get; set; }
        public int TotalTickets { get; set; }
        public List<string>? ImgListEvent { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public required string OrganizerName { get; set; }
        public string EventCategory { get; set; } = default!;
    }
}
