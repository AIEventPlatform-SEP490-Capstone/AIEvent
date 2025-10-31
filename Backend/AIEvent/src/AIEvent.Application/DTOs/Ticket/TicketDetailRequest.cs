using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketDetailRequest
    {
        public Guid? Id { get; set; }

        [Required(ErrorMessage = "TicketName is required")]
        public required string TicketName { get; set; }

        [Required(ErrorMessage = "TicketPrice is required")]
        [Range(0, double.MaxValue, ErrorMessage = "TicketPrice must be greater than or equal to 0")]
        public required decimal TicketPrice { get; set; }

        [Required(ErrorMessage = "TicketQuantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "TicketQuantity must be greater than 0")]
        public int TicketQuantity { get; set; }

        public string? TicketDescription { get; set; }

        public string RuleRefundRequestId { get; set; } = string.Empty;  
    }
}
