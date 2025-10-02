using AIEvent.Domain.Base;

namespace AIEvent.Domain.Entities
{
    public partial class RefundRuleDetail : BaseEntity
    {
        public Guid RefundRuleId { get; set; }
        public int? MinDaysBeforeEvent { get; set; }
        public int? MaxDaysBeforeEvent { get; set; }
        public int? RefundPercent { get; set; }
        public string? Note { get; set; }
        public RefundRule RefundRule { get; set; } = default!;
    }
}
