using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.PaymentInformation
{
    public class CreatePaymentInformationRequest
    {
        [Required(ErrorMessage = "Account holder name is required")]
        public required string AccountHolderName { get; set; }

        [Required(ErrorMessage = "Account number is required")]
        [StringLength(20, MinimumLength = 6, ErrorMessage = "Account number must be between 6 and 20 digits")]
        [RegularExpression(@"^\d+$", ErrorMessage = "Account number must contain only digits")]
        public required string AccountNumber { get; set; }
        [Required(ErrorMessage = "Bank name is required")]
        public required string BankName { get; set; }

        [Required(ErrorMessage = "Branch name is required")]
        public required string BranchName { get; set; }
        public required string BankBin { get; set; }
        public string? BankShortName { get; set; }
        public string? BankLogo { get; set; }
    }
}
