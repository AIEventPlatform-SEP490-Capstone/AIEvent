using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Payment
{
    public class OnlyPayOutRequest
    {
        [Required(ErrorMessage = "PaymentInfoId required")]
        public Guid PaymentInfoId { get; set; }
        [Required(ErrorMessage = "Amount required")]
        [Range(4000, int.MaxValue, ErrorMessage = "Amount must be greater than 4000")]
        public int Amount { get; set; }
        public string? Description { get; set; } = "Rút tiền";
    }
}
