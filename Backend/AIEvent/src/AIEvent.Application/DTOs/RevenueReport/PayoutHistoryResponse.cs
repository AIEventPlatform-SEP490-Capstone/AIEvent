namespace AIEvent.Application.DTOs.RevenueReport
{
    public class PayoutHistoryResponse
    {
        public Guid RevenueReportId { get; set; }
        public Guid OrganizerProfileId { get; set; }
        public string OrganizerName { get; set; } = string.Empty;
        public string OrganizerEmail { get; set; } = string.Empty;
        public string? CompanyName { get; set; }
        public Guid EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public decimal GrossRevenue { get; set; }
        public decimal PlatformFee { get; set; }
        public decimal NetRevenue { get; set; }
        public int ReportMonth { get; set; }
        public int ReportYear { get; set; }
        public DateTime? PayoutDate { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}

