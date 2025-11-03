using System.ComponentModel.DataAnnotations.Schema;

namespace AIEvent.Application.DTOs.RevenueReport
{
    public class RevenueReportRequest
    {
        public Guid OrganizerProfileId { get; set; }
        public Guid EventId { get; set; }
        public Guid PaymentInforId { get; set; }
        public required string EventName { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime ConfirmDate { get; set; }
    }
}
