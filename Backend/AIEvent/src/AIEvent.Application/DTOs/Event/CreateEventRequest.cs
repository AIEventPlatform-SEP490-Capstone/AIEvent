using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace AIEvent.Application.DTOs.Event
{
    public class CreateEventRequest
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required DateTime StartTime { get; set; }
        public required DateTime EndTime { get; set; }
        public bool? isOnlineEvent { get; set; }
        public string? LocationName { get; set; }
        public string? DetailedDescription { get; set; }
        public int TotalTickets { get; set; }
        public TicketType TicketType { get; set; }
        public List<IFormFile>? ImgListEvent { get; set; }
        public bool RequireApproval { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public bool? Publish { get; set; } = false;
        public List<TicketDetailRequest> TicketDetails { get; set; } = new List<TicketDetailRequest>();
        public List<EventTagRequest> Tags { get; set; } = new List<EventTagRequest>();
        public string? EventCategoryId { get; set; } 
    }
}
