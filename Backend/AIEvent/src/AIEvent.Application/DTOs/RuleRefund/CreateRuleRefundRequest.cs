using AIEvent.Application.DTOs.RuleRefundDetail;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.RuleRefund
{
    public class CreateRuleRefundRequest
    {
        [Required(ErrorMessage = "Rule name is required")]
        public required string RuleName { get; set; } = null!;
        [Required(ErrorMessage = "Rule description is required")]
        public required string RuleDescription { get; set; } = null!;
        [Required(ErrorMessage = "At least one rule detail is required")]
        [MinLength(1, ErrorMessage = "At least one rule detail is required")]
        public List<RuleRefundDetailRequest> RuleRefundDetails { get; set; } = new List<RuleRefundDetailRequest>();
    }
}
