using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Payment
{
    public class OnlyPayOutRequest
    {
        [Required(ErrorMessage = "PaymentInfoId không được để trống")]
        public Guid PaymentInfoId { get; set; }
        [Required(ErrorMessage = "Amount không được để trống")]
        [Range(4000, int.MaxValue, ErrorMessage = "Amount phải lớn hơn 4000")]
        public int Amount { get; set; }
        public string? Description { get; set; } = "Rút tiền";
    }
}
