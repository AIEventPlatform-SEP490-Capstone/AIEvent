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
using System.Data;

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
                if (user == null || !user.IsActive)
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

                var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
                var rule = _mapper.Map<RefundRule>(request);

                if (rule == null)
                {
                    return ErrorResponse.FailureResult("Failed to map refund rule", ErrorCodes.InternalServerError);
                }

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

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            var rules = await _unitOfWork.RefundRuleRepository.GetByIdAsync(Guid.Parse(ruleId));

            if (rules == null || rules.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("Rule not found or inactive", ErrorCodes.InvalidInput);
            if (rules.IsSystem && !isAdmin)
                return ErrorResponse.FailureResult("System rule cannot be modified by user", ErrorCodes.PermissionDenied);
            if (!isAdmin && rules.CreatedBy != userId.ToString())
                return ErrorResponse.FailureResult("You can only modify your own rules", ErrorCodes.PermissionDenied);

            await _unitOfWork.RefundRuleRepository.DeleteAsync(rules);
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

        public async Task<Result> UpdateRuleAsync(Guid userId, string RuleRefundId, UpdateRuleRefundRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                var isAdmin = await _userManager.IsInRoleAsync(user!, "Admin");
                var ruleRefund = await _unitOfWork.RefundRuleRepository
                                                    .Query()
                                                    .Include(r => r.RefundRuleDetails)
                                                    .FirstOrDefaultAsync(r => r.Id == Guid.Parse(RuleRefundId));
                if (ruleRefund == null)
                    return ErrorResponse.FailureResult("Rule not found", ErrorCodes.InvalidInput);
                if (ruleRefund.IsSystem && !isAdmin)
                    return ErrorResponse.FailureResult("System rule cannot be modified by user", ErrorCodes.PermissionDenied);
                if (!isAdmin && ruleRefund.CreatedBy != userId.ToString())
                    return ErrorResponse.FailureResult("You can only modify your own rules", ErrorCodes.PermissionDenied);

                _mapper.Map(request, ruleRefund);
                await _unitOfWork.RefundRuleRepository.UpdateAsync(ruleRefund);

                var requestDetailIds = request.RuleRefundDetails
                                      .Where(d => d.RuleRefundDetailId.HasValue)
                                      .Select(d => d.RuleRefundDetailId)
                                      .ToList();

                var toRemove = ruleRefund.RefundRuleDetails
                                         .Where(d => !requestDetailIds.Contains(d.Id))
                                         .ToList();
                foreach (var rd in toRemove)
                {
                    await _unitOfWork.RefundRuleDetailRepository.DeleteAsync(rd);
                }

                foreach (var rule in request.RuleRefundDetails)
                {
                    if (rule.RuleRefundDetailId.HasValue)
                    {
                        var ruleDetail = await _unitOfWork.RefundRuleDetailRepository.GetByIdAsync(rule.RuleRefundDetailId);
                        _mapper.Map(rule, ruleDetail);
                        await _unitOfWork.RefundRuleDetailRepository.UpdateAsync(ruleDetail!);
                    }
                    else
                    {
                        var newDetail = _mapper.Map<RefundRuleDetail>(rule);
                        newDetail.RefundRuleId = Guid.Parse(RuleRefundId);
                        await _unitOfWork.RefundRuleDetailRepository.AddAsync(newDetail);
                    }
                }
                return Result.Success();
            });
        }
    }
}
