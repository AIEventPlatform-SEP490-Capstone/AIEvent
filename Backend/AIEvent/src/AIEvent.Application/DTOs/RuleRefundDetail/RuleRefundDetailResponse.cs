namespace AIEvent.Application.DTOs.RuleRefundDetail
{
    public class RuleRefundDetailResponse
    {
        public Guid RuleRefundDetailId { get; set; }
        public int? MinDaysBeforeEvent { get; set; }
        public int? MaxDaysBeforeEvent { get; set; }
        public int? RefundPercent { get; set; }
        public string? Note { get; set; }
    }
}
