using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class RuleRefundService : IRuleRefundService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly UserManager<AppUser> _userManager;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IMapper _mapper;
        public RuleRefundService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IMapper mapper, UserManager<AppUser> userManager)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _mapper = mapper;
            _userManager = userManager;
        }

        public async Task<Result> CreateRuleAsync(Guid userId, CreateRuleRefundRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
                var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                var rule = _mapper.Map<RefundRule>(request);
                if (isAdmin)
                    rule.IsSystem = true;
                await _unitOfWork.RefundRuleRepository.AddAsync(rule);
                return Result.Success();
            });
        }

        public async Task<Result> DeleteRuleAsync(Guid userId, string ruleId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            var rules = await _unitOfWork.RefundRuleRepository.GetByIdAsync(Guid.Parse(ruleId));
            if (rules == null)
                return ErrorResponse.FailureResult("Rule not found or inactive", ErrorCodes.InvalidInput);
            await _unitOfWork.RefundRuleRepository.DeleteAsync(rules);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result> DeleteRuleDetailAsync(Guid userId, string ruleDetailId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            var ruleDetails = await _unitOfWork.RefundRuleDetailRepository.GetByIdAsync(Guid.Parse(ruleDetailId));
            if (ruleDetails == null)
                return ErrorResponse.FailureResult("Rule Details not found or inactive", ErrorCodes.InvalidInput);
            await _unitOfWork.RefundRuleDetailRepository.DeleteAsync(ruleDetails);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result<BasePaginated<RuleRefundResponse>>> GetRuleRefundAsync(Guid userId, int pageNumber, int pageSize)
        {
            IQueryable<RefundRule> ruleQuery = _unitOfWork.RefundRuleRepository
                .Query()
                .AsNoTracking()
                .Where(r => !r.DeletedAt.HasValue)
                .OrderByDescending(r => r.CreatedAt);
            var user = await _userManager.FindByIdAsync(userId.ToString());
            var isAdmin = await _userManager.IsInRoleAsync(user!, "Admin");
            if (!isAdmin)
                ruleQuery = ruleQuery.Where(r => r.CreatedBy == userId.ToString() || r.IsSystem == true);

            int totalCount = await ruleQuery.CountAsync();

            var result = await ruleQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new RuleRefundResponse
                {
                   RuleRefundId = p.Id,
                   RuleName = p.RuleName,
                   RuleDescription = p.RuleDescription,
                   CustomAt = p.UpdatedAt,
                   IsCustom = !p.IsSystem,
                   CustomBy = p.UpdatedBy ?? p.CreatedBy,
                   RuleRefundDetails = p.RefundRuleDetails
                                       .Select(rd => new RuleRefundDetailResponse
                                       {
                                           RuleRefundDetailId = rd.Id,
                                           MaxDaysBeforeEvent = rd.MaxDaysBeforeEvent,
                                           MinDaysBeforeEvent = rd.MinDaysBeforeEvent,
                                           Note = rd.Note,
                                           RefundPercent = rd.RefundPercent
                                       }).ToList()
                })
                .ToListAsync();

            return new BasePaginated<RuleRefundResponse>(result, totalCount, pageNumber, pageSize);
        }
    }
}
