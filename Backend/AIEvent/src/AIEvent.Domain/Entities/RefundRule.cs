using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class RefundRule : BaseEntity
    {
        public required string RuleName { get; set; }
        public string? RuleDescription { get; set; } 
        public ICollection<RefundRuleDetail> RefundRuleDetails { get; set; } = new List<RefundRuleDetail>();
    }
}
