using AIEvent.Application.DTOs.RuleRefundDetail;

namespace AIEvent.Application.DTOs.RuleRefund
{
    public class CreateRuleRefundRequest
    {
        public required string RuleName { get; set; }
        public string? RuleDescription { get; set; }
        public List<RuleRefundDetailRequest> RuleRefundDetails { get; set; } = new List<RuleRefundDetailRequest>();
    }
}
