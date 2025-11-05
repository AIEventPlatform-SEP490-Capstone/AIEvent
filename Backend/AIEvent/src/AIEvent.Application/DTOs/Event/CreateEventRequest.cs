using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Event
{
    public class CreateEventRequest
    {
        [Required(ErrorMessage = "Title is required")]
        public required string Title { get; set; }
        [Required(ErrorMessage = "Description is required")]
        public required string Description { get; set; }
        [Required(ErrorMessage = "StartTime is required")]
        public required DateTime StartTime { get; set; }
        [Required(ErrorMessage = "EndTime is required")]
        public required DateTime EndTime { get; set; }
        [Required(ErrorMessage = "LocationName is required")]
        public string? LocationName { get; set; }
        public string? DetailedDescription { get; set; }
        public string? LinkRef { get; set; }
        public int TotalTickets { get; set; }
        [Required(ErrorMessage = "Ticket type is required")]
        public TicketPricingType TicketPricingType { get; set; }
        [MinLength(1, ErrorMessage = "Please upload at least one image")]
        [Required(ErrorMessage = "Please upload at least one image")]
        public List<string>? ImgListEvent { get; set; }
        public List<string>? ImgListEvidences { get; set; }
        public EventStatus? Status { get; set; } = EventStatus.PendingApproval;
        [Required(ErrorMessage = "District is required")]
        public string? District { get; set; }
        [Required(ErrorMessage = "Address is required")]
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public bool? Publish { get; set; } = false;
        [Required(ErrorMessage = "SaleStartTime is required")]
        public DateTime? SaleStartTime { get; set; }  
        [Required(ErrorMessage = "SaleEndTime is required")]
        public DateTime? SaleEndTime { get; set; }
        [MinLength(1, ErrorMessage = "TicketTypes is required")]
        [Required(ErrorMessage = "TicketTypes is required")]
        public List<TicketTypeRequest> TicketTypes { get; set; } = new List<TicketTypeRequest>();
        public List<EventTagRequest>? Tags { get; set; } = new List<EventTagRequest>();
        [Required(ErrorMessage = "EventCategoryId is required")]
        public Guid? EventCategoryId { get; set; }
    }
}
