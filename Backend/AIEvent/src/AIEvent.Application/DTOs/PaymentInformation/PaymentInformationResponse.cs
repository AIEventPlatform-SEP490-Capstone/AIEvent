namespace AIEvent.Application.DTOs.PaymentInformation
{
    public class PaymentInformationResponse
    {
        public Guid PaymentInformationId { get; set; }
        public string? AccountHolderName { get; set; }
        public string? AccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BranchName { get; set; }
    }
}
