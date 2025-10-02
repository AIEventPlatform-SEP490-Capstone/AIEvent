using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IRuleRefundService
    {
        Task<Result> CreateRuleAsync(Guid userId, CreateRuleRefundRequest request);
        Task<Result> DeleteRuleAsync(Guid userId, string ruleId);
        Task<Result> DeleteRuleDetailAsync(Guid userId, string ruleDetailId);
        Task<Result<BasePaginated<RuleRefundResponse>>> GetRuleRefundAsync(Guid userId, int pageNumber, int pageSize);
    }
}
