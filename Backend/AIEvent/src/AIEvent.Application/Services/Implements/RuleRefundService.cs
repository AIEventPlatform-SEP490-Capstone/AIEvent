using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Infrastructure.Repositories.Interfaces;
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

        public async Task<Result> CreateRuleAsync(CreateRuleRefundRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var validationResult = ValidationHelper.ValidateModel(request);
                if (!validationResult.IsSuccess)
                    return validationResult;
                
                var detailValidationResult = ValidationHelper.ValidateModelList(request.RuleRefundDetails);
                if (!detailValidationResult.IsSuccess)
                    return detailValidationResult;

                var invalidDetail = request.RuleRefundDetails
                    .FirstOrDefault(d => d.MinDaysBeforeEvent.HasValue && d.MaxDaysBeforeEvent.HasValue && d.MinDaysBeforeEvent > d.MaxDaysBeforeEvent);
                if (invalidDetail != null)
                    return ErrorResponse.FailureResult(
                        $"MinDays ({invalidDetail.MinDaysBeforeEvent}) cannot be greater than MaxDays ({invalidDetail.MaxDaysBeforeEvent})",
                        ErrorCodes.InvalidInput);
                  
                var rule = _mapper.Map<RefundRule>(request);
                if (rule == null)
                    return ErrorResponse.FailureResult("Failed to map refund rule", ErrorCodes.InternalServerError);

                await _unitOfWork.RefundRuleRepository.AddAsync(rule);
                return Result.Success();
            });
        }

        public async Task<Result> DeleteRuleAsync(Guid ruleId)
        {
            if (ruleId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput); 
            var rules = await _unitOfWork.RefundRuleRepository.GetByIdAsync(ruleId, true);

            if (rules == null || rules.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("Rule not found or inactive", ErrorCodes.InvalidInput); 

            await _unitOfWork.RefundRuleRepository.DeleteAsync(rules);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result<BasePaginated<RuleRefundResponse>>> GetRuleRefundAsync(int pageNumber, int pageSize)
        {
            IQueryable<RefundRule> ruleQuery = _unitOfWork.RefundRuleRepository
                .Query()
                .AsNoTracking()
                .Where(r => !r.DeletedAt.HasValue)
                .OrderByDescending(r => r.CreatedAt);
             
            int totalCount = await ruleQuery.CountAsync();

            var result = await ruleQuery
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new RuleRefundResponse
                {
                    RuleRefundId = p.Id,
                    RuleName = p.RuleName,
                    RuleDescription = p.RuleDescription, 
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

        public async Task<Result> UpdateRuleAsync(Guid ruleRefundId, UpdateRuleRefundRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (ruleRefundId == Guid.Empty)
                    return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
                
                var validationResult = ValidationHelper.ValidateModel(request);
                if (!validationResult.IsSuccess)
                    return validationResult;
                
                var ruleRefund = await _unitOfWork.RefundRuleRepository
                                                    .Query()
                                                    .Include(r => r.RefundRuleDetails)
                                                    .FirstOrDefaultAsync(r => r.Id == ruleRefundId);
                if (ruleRefund == null)
                    return ErrorResponse.FailureResult("Rule not found", ErrorCodes.InvalidInput); 
                _mapper.Map(request, ruleRefund);
                await _unitOfWork.RefundRuleRepository.UpdateAsync(ruleRefund);
                return Result.Success();
            });
        }

        public async Task<Result> UpdateRuleDetailAsync(Guid ruleRefundDetailId, UpdateRuleRefundDetailRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (ruleRefundDetailId == Guid.Empty)
                    return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
                
                var validationResult = ValidationHelper.ValidateModel(request);
                if (!validationResult.IsSuccess)
                    return validationResult;
                if (request.MinDaysBeforeEvent > request.MaxDaysBeforeEvent)
                    return ErrorResponse.FailureResult(
                        $"Invalid rule detail: MinDays ({request.MinDaysBeforeEvent}) cannot be greater than MaxDays ({request.MaxDaysBeforeEvent})",
                        ErrorCodes.InvalidInput);
                
                var ruleRefund = await _unitOfWork.RefundRuleDetailRepository
                                                    .Query()
                                                    .FirstOrDefaultAsync(r => r.Id == ruleRefundDetailId);
                if (ruleRefund == null)
                    return ErrorResponse.FailureResult("Rule detail not found", ErrorCodes.InvalidInput); 

                _mapper.Map(request, ruleRefund);
                await _unitOfWork.RefundRuleDetailRepository.UpdateAsync(ruleRefund);
                return Result.Success();
            });
        }

        public async Task<Result> DeleteRuleDetailAsync(Guid ruleRefundDetailId)
        {
            if (ruleRefundDetailId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput); 
            var rules = await _unitOfWork.RefundRuleDetailRepository
                                        .Query()
                                        .FirstOrDefaultAsync(rd => rd.Id == ruleRefundDetailId);

            if (rules == null || rules.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("Rule detail not found or inactive", ErrorCodes.InvalidInput); 
            await _unitOfWork.RefundRuleDetailRepository.DeleteAsync(rules);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result> CreateRuleDetailAsync(Guid ruleRefundId, RuleRefundDetailRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (ruleRefundId == Guid.Empty)
                    return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
                
                var validationResult = ValidationHelper.ValidateModel(request);
                if (!validationResult.IsSuccess)
                    return validationResult;
                if (request.MinDaysBeforeEvent > request.MaxDaysBeforeEvent)
                    return ErrorResponse.FailureResult(
                        $"Invalid rule detail: MinDays ({request.MinDaysBeforeEvent}) cannot be greater than MaxDays ({request.MaxDaysBeforeEvent})",
                        ErrorCodes.InvalidInput);
                var rule = await _unitOfWork.RefundRuleRepository.GetByIdAsync(ruleRefundId, true);
                if (rule == null)
                    return ErrorResponse.FailureResult("Rule not found", ErrorCodes.InvalidInput); 

                var ruleDetail = new RefundRuleDetail
                {
                    RefundRuleId = ruleRefundId,
                    MaxDaysBeforeEvent = request.MaxDaysBeforeEvent,
                    MinDaysBeforeEvent = request.MinDaysBeforeEvent,
                    RefundPercent = request.RefundPercent,
                    Note = request.Note,
                };

                if (ruleDetail == null)
                    return ErrorResponse.FailureResult("Failed to add refund rule detail", ErrorCodes.InternalServerError);

                await _unitOfWork.RefundRuleDetailRepository.AddAsync(ruleDetail);
                return Result.Success();
            });
        }
    }
}
