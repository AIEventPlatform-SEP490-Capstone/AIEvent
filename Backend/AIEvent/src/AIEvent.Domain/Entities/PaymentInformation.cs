using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public class PaymentInformation : BaseEntity
    {
        public Guid UserId { get; set; }
        public required string AccountHolderName { get; set; } 
        public required string AccountNumber { get; set; }       
        public required string BankName { get; set; }           
        public required string BranchName { get; set; }
        public User User { get; set; } = default!;
    }
}
