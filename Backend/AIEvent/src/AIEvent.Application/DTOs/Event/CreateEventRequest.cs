using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Http;
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
        public string? LocationName { get; set; }
        public string? DetailedDescription { get; set; }
        public string? LinkRef { get; set; }
        public int TotalTickets { get; set; }
        [Required(ErrorMessage = "Ticket type is required")]
        public TicketType TicketType { get; set; }
        [MinLength(1, ErrorMessage = "Please upload at least one image")]
        [Required(ErrorMessage = "Please upload at least one image")]
        public List<IFormFile>? ImgListEvent { get; set; }
        public List<IFormFile>? ImgListEvidences { get; set; }
        public ConfirmStatus? RequireApproval { get; set; } = ConfirmStatus.NeedConfirm;
        public string? City { get; set; }
        public string? Address { get; set; }
        public float? Latitude { get; set; }
        public float? Longitude { get; set; }
        public bool? Publish { get; set; } = false;
        [Required(ErrorMessage = "SaleStartTime is required")]
        public DateTime? SaleStartTime { get; set; }  
        [Required(ErrorMessage = "SaleEndTime is required")]
        public DateTime? SaleEndTime { get; set; }
        [MinLength(1, ErrorMessage = "Ticket is required")]
        [Required(ErrorMessage = "Ticket is required")]
        public List<TicketDetailRequest> TicketDetails { get; set; } = new List<TicketDetailRequest>();
        public List<EventTagRequest>? Tags { get; set; } = new List<EventTagRequest>();
        public string? EventCategoryId { get; set; }
    }
}
