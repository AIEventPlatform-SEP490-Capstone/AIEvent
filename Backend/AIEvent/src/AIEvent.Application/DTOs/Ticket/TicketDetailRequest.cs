using AIEvent.Application.DTOs.RuleRefund;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Ticket
{
    public class TicketDetailRequest
    {
        [Required]
        public required string TicketName { get; set; }
        public required decimal TicketPrice { get; set; }
        [Required]
        public int TicketQuantity { get; set; }
        public string? TicketDescription { get; set; }
        public required string RuleRefundRequestId { get; set; }
    }
}
