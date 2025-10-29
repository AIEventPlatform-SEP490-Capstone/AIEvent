using AIEvent.Application.DTOs.RuleRefundDetail;

namespace AIEvent.Application.DTOs.RuleRefund
{
    public class RuleRefundResponse
    {
        public Guid RuleRefundId { get; set; }
        public required string RuleName { get; set; }
        public string? RuleDescription { get; set; } 
        public List<RuleRefundDetailResponse> RuleRefundDetails { get; set; } = new List<RuleRefundDetailResponse>();
    }
}
