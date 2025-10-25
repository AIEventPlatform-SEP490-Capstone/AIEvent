using AIEvent.Domain.Base;
using AIEvent.Domain.Enums;

namespace AIEvent.Domain.Entities
{
    public class WithdrawRequest : BaseEntity
    {
        public Guid UserId { get; set; }
        public decimal Amount { get; set; }
        public string BankName { get; set; } = "";
        public string BankAccountNumber { get; set; } = "";
        public string BankAccountName { get; set; } = "";
        public WithdrawStatus Status { get; set; } = WithdrawStatus.Pending;
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
        public User User { get; set; } = default!;
        public string? Note { get; set; }
    }
}
