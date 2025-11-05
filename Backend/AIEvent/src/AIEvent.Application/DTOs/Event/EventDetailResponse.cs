using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class EventDetailResponse
    {
        public Guid EventId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; } 
        public string? LocationName { get; set; }
        public string? DetailedDescription { get; set; }
        public int TotalTickets { get; set; }
        public int SoldQuantity { get; set; } = 0;
        public int RemainingTickets { get; set; }
        public TicketPricingType TicketPricingType { get; set; }
        public List<string>? ImgListEvent { get; set; }
        public List<string>? ImgListEvidences { get; set; }
        public ConfirmEventStatus RequireApproval { get; set; }
        public string? District { get; set; }
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public DateTime? SaleStartTime { get; set; } 
        public DateTime? SaleEndTime { get; set; }
        public OrganizerEventResponse OrganizerEvent { get; set; } = default!;
        public List<TagResponse> EventTags { get; set; } = new List<TagResponse>();
        public EventCategoryResponse EventCategory { get; set; } = default!;
        public List<TicketTypeResponse> TicketDetails { get; set; } = new List<TicketTypeResponse>();
    }
}
