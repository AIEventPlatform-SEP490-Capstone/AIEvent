using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.RuleRefundDetail
{
    public class UpdateRuleRefundDetailRequest
    {
        public int MinDaysBeforeEvent { get; set; }
        public int MaxDaysBeforeEvent { get; set; }
        [Range(0, 100, ErrorMessage = "Refund percent value from 0 to 100.")]
        public decimal RefundPercent { get; set; }
        public string? Note { get; set; }
    }
}
