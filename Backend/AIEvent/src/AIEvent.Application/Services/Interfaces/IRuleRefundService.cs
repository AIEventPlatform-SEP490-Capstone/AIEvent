using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IRuleRefundService
    {
        Task<Result> CreateRuleAsync(Guid userId, CreateRuleRefundRequest request);
        Task<Result> DeleteRuleAsync(Guid userId, string ruleId);
        Task<Result> UpdateRuleAsync(Guid userId, string RuleRefundId, UpdateRuleRefundRequest request);
        Task<Result<BasePaginated<RuleRefundResponse>>> GetRuleRefundAsync(Guid userId, int pageNumber, int pageSize);
        Task<Result> UpdateRuleDetailAsync(Guid userId, string ruleRefundDetailId, UpdateRuleRefundDetailRequest request);
        Task<Result> DeleteRuleDetailAsync(Guid userId, string ruleRefundDetailId);
        Task<Result> CreateRuleDetailAsync(Guid userId, string ruleRefundId, RuleRefundDetailRequest request);
    }
}
