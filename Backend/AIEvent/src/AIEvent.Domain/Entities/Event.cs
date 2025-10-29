using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public partial class Event : BaseEntity
    {
        public Guid OrganizerProfileId { get; set; }
        public Guid EventCategoryId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; } 
        public string? LocationName { get; set; }
        public string? DetailedDescription { get; set; }
        public int TotalTickets { get; set; }
        public int SoldQuantity { get; set; } = 0;
        public int RemainingTickets { get; set; }
        public TicketType TicketType { get; set; }
        public string? ImgListEvent { get; set; }
        public bool? Publish { get; set; } = false;
        public ConfirmStatus? RequireApproval { get; set; }
        public DateTime? RequireApprovalAt { get; set; }
        public Guid? RequireApprovalBy { get; set; }
        public string? ReasonReject { get; set; }
        public string? ReasonCancel { get; set; } 
        public string? LinkRef { get; set; }
        public string? City { get; set; }
        public string? Evidences { get; set; }
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public DateTime? SaleStartTime { get; set; }  
        public DateTime? SaleEndTime { get; set; }
        public EventCategory EventCategory { get; set; } = default!;
        public virtual OrganizerProfile? OrganizerProfile { get; set; }
        public virtual ICollection<TicketDetail> TicketDetails { get; set; } = new List<TicketDetail>();
        public virtual ICollection<EventTag> EventTags { get; set; } = new List<EventTag>();
        public ICollection<FavoriteEvent> FavoriteEvents { get; set; } = new List<FavoriteEvent>();
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
