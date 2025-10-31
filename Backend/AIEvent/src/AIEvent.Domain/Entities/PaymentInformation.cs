using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public class PaymentInformation : BaseEntity
    {
        public Guid UserId { get; set; }
        public required string AccountHolderName { get; set; }
        public required string AccountNumber { get; set; }
        public required string BankName { get; set; }
        public required string BankBin { get; set; }
        public string? BankShortName { get; set; }
        public string? BankLogo { get; set; }
        public string? BranchName { get; set; }
        public User User { get; set; } = default!;
    }
}
