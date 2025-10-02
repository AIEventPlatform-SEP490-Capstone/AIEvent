using AIEvent.Application.DTOs.RuleRefundDetail;

namespace AIEvent.Application.DTOs.RuleRefund
{
    public class UpdateRuleRefundRequest
    {
        public required string RuleName { get; set; }
        public string? RuleDescription { get; set; }
        public List<UpdateRuleRefundDetailRequest> RuleRefundDetails { get; set; } = new List<UpdateRuleRefundDetailRequest>();
    }
}
