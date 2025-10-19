using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace AIEvent.Application.Services.Implements
{
    public class RuleRefundService : IRuleRefundService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IMapper _mapper;
        public RuleRefundService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _mapper = mapper;
        }

        public async Task<Result> CreateRuleAsync(Guid userId, CreateRuleRefundRequest request)
        {
            var invalidDetail = request.RuleRefundDetails
                                    .FirstOrDefault(d => d.MinDaysBeforeEvent > d.MaxDaysBeforeEvent);

            if (invalidDetail != null)
                return ErrorResponse.FailureResult(
                    $"Invalid rule detail: MinDays ({invalidDetail.MinDaysBeforeEvent}) cannot be greater than MaxDays ({invalidDetail.MaxDaysBeforeEvent})",
                    ErrorCodes.InvalidInput);
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
                if (user == null || !user.IsActive || user.DeletedAt.HasValue)
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

                var role = await _unitOfWork.RoleRepository.GetByIdAsync(user.RoleId, true);
                if (role == null)
                    return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
                var rule = _mapper.Map<RefundRule>(request);

                if (rule == null)
                    return ErrorResponse.FailureResult("Failed to map refund rule", ErrorCodes.InternalServerError);

                if (role.Name.Equals("Admin") || role.Name.Equals("Manager"))
                    rule.IsSystem = true;
                await _unitOfWork.RefundRuleRepository.AddAsync(rule);
                return Result.Success();
            });
        }

        public async Task<Result> DeleteRuleAsync(Guid userId, Guid ruleId)
        {
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || !user.IsActive || user.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            var role = await _unitOfWork.RoleRepository.GetByIdAsync(user.RoleId, true);
            if (role == null)
                return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            var rules = await _unitOfWork.RefundRuleRepository.GetByIdAsync(ruleId, true);

            if (rules == null || rules.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("Rule not found or inactive", ErrorCodes.InvalidInput);
            if (rules.IsSystem && !role!.Name.Equals("Admin") && !role.Name.Equals("Manager"))
                return ErrorResponse.FailureResult("System rule cannot be modified by user", ErrorCodes.PermissionDenied);
            if (!role!.Name.Equals("Admin") && !role.Name.Equals("Manager") && rules.CreatedBy != userId.ToString())
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
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || !user.IsActive || user.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            var role = await _unitOfWork.RoleRepository.GetByIdAsync(user.RoleId, true);
            if (role == null)
                return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
            if (!role.Name.Equals("Admin"))
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

        public async Task<Result> UpdateRuleAsync(Guid userId, Guid ruleRefundId, UpdateRuleRefundRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
                if (user == null || !user.IsActive || user.DeletedAt.HasValue)
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
                var role = await _unitOfWork.RoleRepository.GetByIdAsync(user.RoleId, true);
                if(role == null)
                    return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);
                var ruleRefund = await _unitOfWork.RefundRuleRepository
                                                    .Query()
                                                    .Include(r => r.RefundRuleDetails)
                                                    .FirstOrDefaultAsync(r => r.Id == ruleRefundId);
                if (ruleRefund == null)
                    return ErrorResponse.FailureResult("Rule not found", ErrorCodes.InvalidInput);
                if (ruleRefund.IsSystem && !role.Name.Equals("Admin") && !role.Name.Equals("Manager"))
                    return ErrorResponse.FailureResult("System rule cannot be modified by user", ErrorCodes.PermissionDenied);
                if (!role.Name.Equals("Admin") && !role.Name.Equals("Manager") && ruleRefund.CreatedBy != userId.ToString())
                    return ErrorResponse.FailureResult("You can only modify your own rules", ErrorCodes.PermissionDenied);

                _mapper.Map(request, ruleRefund);
                await _unitOfWork.RefundRuleRepository.UpdateAsync(ruleRefund);
                return Result.Success();
            });
        }

        public async Task<Result> UpdateRuleDetailAsync(Guid userId, Guid ruleRefundDetailId, UpdateRuleRefundDetailRequest request)
        {
            if (request.MinDaysBeforeEvent > request.MaxDaysBeforeEvent)
                return ErrorResponse.FailureResult(
                    $"Invalid rule detail: MinDays ({request.MinDaysBeforeEvent}) cannot be greater than MaxDays ({request.MaxDaysBeforeEvent})",
                    ErrorCodes.InvalidInput);
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
                if (user == null || !user.IsActive || user.DeletedAt.HasValue)
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
                var role = await _unitOfWork.RoleRepository.GetByIdAsync(user.RoleId, true);
                if (role == null)
                    return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);

                var ruleRefund = await _unitOfWork.RefundRuleDetailRepository
                                                    .Query()
                                                    .FirstOrDefaultAsync(r => r.Id == ruleRefundDetailId);
                if (ruleRefund == null)
                    return ErrorResponse.FailureResult("Rule not found", ErrorCodes.InvalidInput);
                if (!role.Name.Equals("Admin") && !role.Name.Equals("Manager"))
                    return ErrorResponse.FailureResult("System rule cannot be modified by user", ErrorCodes.PermissionDenied);
                if (!role.Name.Equals("Admin") && !role.Name.Equals("Manager") && ruleRefund.CreatedBy != userId.ToString())
                    return ErrorResponse.FailureResult("You can only modify your own rules", ErrorCodes.PermissionDenied);

                _mapper.Map(request, ruleRefund);
                await _unitOfWork.RefundRuleDetailRepository.UpdateAsync(ruleRefund);
                return Result.Success();
            });
        }

        public async Task<Result> DeleteRuleDetailAsync(Guid userId, Guid ruleRefundDetailId)
        {
            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || !user.IsActive || user.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            var role = await _unitOfWork.RoleRepository.GetByIdAsync(user.RoleId, true);
            if (role == null)
                return ErrorResponse.FailureResult("Role not found", ErrorCodes.NotFound);

            var rules = await _unitOfWork.RefundRuleDetailRepository
                                        .Query()
                                        .FirstOrDefaultAsync(rd => rd.Id == ruleRefundDetailId);

            if (rules == null || rules.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("Rule detail not found or inactive", ErrorCodes.InvalidInput);
            if (!role.Name.Equals("Admin") && !role.Name.Equals("Manager"))
                return ErrorResponse.FailureResult("System rule detail cannot be modified by user", ErrorCodes.PermissionDenied);
            if (!role.Name.Equals("Admin") && !role.Name.Equals("Manager") && rules.CreatedBy != userId.ToString())
                return ErrorResponse.FailureResult("You can only modify your own rules detail", ErrorCodes.PermissionDenied);

            await _unitOfWork.RefundRuleDetailRepository.DeleteAsync(rules);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result> CreateRuleDetailAsync(Guid userId, Guid ruleRefundId, RuleRefundDetailRequest request)
        {
            if (request.MinDaysBeforeEvent > request.MaxDaysBeforeEvent)
                return ErrorResponse.FailureResult(
                    $"Invalid rule detail: MinDays ({request.MinDaysBeforeEvent}) cannot be greater than MaxDays ({request.MaxDaysBeforeEvent})",
                    ErrorCodes.InvalidInput);
            var rule = await _unitOfWork.RefundRuleRepository.GetByIdAsync(ruleRefundId, true);
            if(rule == null)
                return ErrorResponse.FailureResult("Rule not found",ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
                if (user == null || !user.IsActive || user.DeletedAt.HasValue)
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

                var ruleDetail = new RefundRuleDetail
                {
                    RefundRuleId = ruleRefundId,
                    MaxDaysBeforeEvent = request.MaxDaysBeforeEvent,
                    MinDaysBeforeEvent = request.MinDaysBeforeEvent,
                    RefundPercent = request.RefundPercent,
                    Note = request.Note,
                };

                if (ruleDetail == null)
                {
                    return ErrorResponse.FailureResult("Failed to add refund rule detail", ErrorCodes.InternalServerError);
                }

                await _unitOfWork.RefundRuleDetailRepository.AddAsync(ruleDetail);
                return Result.Success();
            });
        }
    }
}
