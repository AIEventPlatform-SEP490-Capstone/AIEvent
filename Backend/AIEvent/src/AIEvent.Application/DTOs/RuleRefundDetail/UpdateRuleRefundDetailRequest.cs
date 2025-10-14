using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.RuleRefundDetail
{
    public class UpdateRuleRefundDetailRequest
    {
        public Guid? RuleRefundDetailId { get; set; }
        public int MinDaysBeforeEvent { get; set; }
        public int MaxDaysBeforeEvent { get; set; }
        [Range(0, 100)]
        public decimal RefundPercent { get; set; }
        public string? Note { get; set; }
    }
}
