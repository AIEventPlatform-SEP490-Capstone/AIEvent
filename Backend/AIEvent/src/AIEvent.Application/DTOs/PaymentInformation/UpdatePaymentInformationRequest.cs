using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.PaymentInformation
{
    public class UpdatePaymentInformationRequest
    {
        public string? AccountHolderName { get; set; }

        [StringLength(20, MinimumLength = 6, ErrorMessage = "Account number must be between 6 and 20 digits")]
        [RegularExpression(@"^\d+$", ErrorMessage = "Account number must contain only digits")]
        public string? AccountNumber { get; set; }

        public string? BankName { get; set; }

        public string? BranchName { get; set; }
        public string? BankBin { get; set; }
        public string? BankShortName { get; set; }
        public string? BankLogo { get; set; }
    }
}
