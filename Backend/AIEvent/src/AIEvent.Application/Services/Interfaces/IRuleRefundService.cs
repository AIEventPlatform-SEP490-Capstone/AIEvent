using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IRuleRefundService
    {
        Task<Result> CreateRuleAsync(CreateRuleRefundRequest request);
        Task<Result> DeleteRuleAsync(Guid ruleId);
        Task<Result> UpdateRuleAsync(Guid RuleRefundId, UpdateRuleRefundRequest request);
        Task<Result<BasePaginated<RuleRefundResponse>>> GetRuleRefundAsync(int pageNumber, int pageSize);
        Task<Result> UpdateRuleDetailAsync(Guid ruleRefundDetailId, UpdateRuleRefundDetailRequest request);
        Task<Result> DeleteRuleDetailAsync(Guid ruleRefundDetailId);
        Task<Result> CreateRuleDetailAsync(Guid ruleRefundId, RuleRefundDetailRequest request);
    }
}
