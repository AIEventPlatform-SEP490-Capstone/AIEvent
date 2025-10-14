using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.RuleRefundDetail
{
    public class RuleRefundDetailRequest
    {
        public int? MinDaysBeforeEvent { get; set; }
        public int? MaxDaysBeforeEvent { get; set; }
        [Range(0, 100)]
        public int? RefundPercent { get; set; }
        public string? Note { get; set; }
    }
}
