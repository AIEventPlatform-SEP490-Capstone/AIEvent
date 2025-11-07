using AIEvent.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Event
{
    public class ApproveEndEventRequest
    {
        [Required(ErrorMessage = "EndEventRequestId is required.")]
        public Guid EndEventRequestId { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        public ConfirmStatus Status { get; set; } 
        public string? AdminNote { get; set; }
    }
}
