using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.RevenueReport
{
    public class PayoutHistoryResponse
    {
        public string HistoryType { get; set; } = string.Empty;
        public Guid? RevenueReportId { get; set; }
        public Guid? WalletTransactionId { get; set; }
        public Guid? OrganizerProfileId { get; set; }
        public string OrganizerName { get; set; } = string.Empty;
        public string OrganizerEmail { get; set; } = string.Empty;
        public string? CompanyName { get; set; } = string.Empty;
        public Guid? EventId { get; set; }
        public string? EventName { get; set; }
        public decimal? GrossRevenue { get; set; }
        public decimal? PlatformFee { get; set; }
        public decimal? NetRevenue { get; set; }
        public decimal Amount { get; set; }
        public int? ReportMonth { get; set; }
        public int? ReportYear { get; set; }
        public DateTime? TransactionDate { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public string? Description { get; set; }
        public TransactionType? TransactionType { get; set; }
    }
}
