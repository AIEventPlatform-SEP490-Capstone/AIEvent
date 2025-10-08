using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using Microsoft.AspNetCore.Http;

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
        public List<IFormFile>? ImgListEvent { get; set; }
        public List<string>? RemoveImageUrls { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public string? EventCategoryId { get; set; }
        public virtual ICollection<EventTagRequest> EventTags { get; set; } = new List<EventTagRequest>();
    }
}
