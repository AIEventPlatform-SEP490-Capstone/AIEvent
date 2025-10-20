using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.RuleRefundDetail
{
    public class RuleRefundDetailRequest
    {
        [Required(ErrorMessage = "Min days before event is required")]
        public int? MinDaysBeforeEvent { get; set; }
        [Required(ErrorMessage = "Max days before event is required")]
        public int? MaxDaysBeforeEvent { get; set; }
        [Required(ErrorMessage = "Refund percent is required")]
        [Range(0, 100, ErrorMessage = "Refund percent value from 0 to 100.")]
        public int? RefundPercent { get; set; }
        public string? Note { get; set; }
    }
}
