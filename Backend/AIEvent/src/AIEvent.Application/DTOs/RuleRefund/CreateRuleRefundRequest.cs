using AIEvent.Application.DTOs.RuleRefundDetail;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.RuleRefund
{
    public class CreateRuleRefundRequest
    {
        [Required]
        public required string RuleName { get; set; } = null!;
        [Required]
        public required string RuleDescription { get; set; } = null!;
        public List<RuleRefundDetailRequest> RuleRefundDetails { get; set; } = new List<RuleRefundDetailRequest>();
    }
}
