using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Event
{
    public class UpdateEventRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? LocationName { get; set; }
        public string? DetailedDescription { get; set; }
        public string? District { get; set; }
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public Guid? EventCategoryId { get; set; }
        public DateTime? SaleStartTime { get; set; }
        public DateTime? SaleEndTime { get; set; }
        public bool? Publish { get; set; } = false;
        public TicketPricingType? TicketPricingType { get; set; }
        public int? TotalTickets { get; set; }
        public string? LinkRef { get; set; }
        public List<string>? ImgListEvent { get; set; }
        public List<string>? ImgListEvidences { get; set; }
        public List<string>? RemoveImageEvidenceUrls { get; set; }
        public List<string>? RemoveImageUrls { get; set; }
        public List<TicketTypeRequest>? TicketTypes { get; set; }
        public List<Guid>? RemoveTicketTypeIds { get; set; }
        public List<Guid>? AddTagIds { get; set; }
        public List<Guid>? RemoveTagIds { get; set; }
    }
}
