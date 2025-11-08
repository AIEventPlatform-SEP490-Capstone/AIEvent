using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Event
{
    public class CompleteEventRequest
    {
        [Required(ErrorMessage = "EventId is required.")]
        public Guid EventId { get; set; }
        [Required(ErrorMessage = "PaymentInformationId is required.")]
        public Guid PaymentInformationId { get; set; }
        public string? Summary { get; set; }

        [Required(ErrorMessage = "At least one evidence image is required.")]
        [MinLength(1, ErrorMessage = "At least one image must be provided.")]
        public List<string> EvidenceImages { get; set; } = new();

    }
}
