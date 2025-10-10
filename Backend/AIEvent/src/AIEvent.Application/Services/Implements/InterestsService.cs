using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Interest;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class InterestsService : IInterestsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;

        public InterestsService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
        }
        public async Task<Result<BasePaginated<InterestResponse>>> GetInterestAsync(int pageNumber, int pageSize)
        {
            IQueryable<Interest> interestQuery = _unitOfWork.InterestRepository
                .Query()
                .AsNoTracking()
                .Where(p => !p.DeletedAt.HasValue)
                .OrderByDescending(s => s.CreatedAt);

            int totalCount = await interestQuery.CountAsync();

            var result = await interestQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new InterestResponse
                {
                    InterestId = p.Id,
                    InterestName = p.Name,
                })
                .ToListAsync();

            return new BasePaginated<InterestResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> CreateInterestAsync(InterestRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var existing = await _unitOfWork.InterestRepository
                                            .Query()
                                            .AsNoTracking()
                                            .FirstOrDefaultAsync(t => t.Name.ToLower() == request.InterestName!.ToLower());
                if (existing != null)
                {
                    return ErrorResponse.FailureResult("Interest is already existing", ErrorCodes.InvalidInput);
                }

                Interest interest = new()
                {
                    Name = request.InterestName,
                };

                await _unitOfWork.InterestRepository.AddAsync(interest);

                return Result.Success();
            });
        }

        public async Task<Result> DeleteInterestAsync(string id)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var interestId = Guid.Parse(id);
                var existing = await _unitOfWork.InterestRepository
                                            .Query()
                                            .FirstOrDefaultAsync(t => t.Id == interestId);

                if (existing == null || existing.DeletedAt.HasValue)
                {
                    return ErrorResponse.FailureResult("Can not found or interest is deleted", ErrorCodes.InvalidInput);
                }

                await _unitOfWork.InterestRepository.DeleteAsync(existing);

                return Result.Success();
            });
        }

        public async Task<Result> UpdateInterestAsync(string id, InterestRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var interestId = Guid.Parse(id);
                var interest = await _unitOfWork.InterestRepository
                                            .Query()
                                            .FirstOrDefaultAsync(t => t.Id == interestId);

                if (interest == null || interest.DeletedAt.HasValue)
                {
                    return ErrorResponse.FailureResult("Can not found or interest is update", ErrorCodes.InvalidInput);
                }

                interest.Name = request.InterestName;

                await _unitOfWork.InterestRepository.UpdateAsync(interest);

                return Result.Success();
            });
        }
    }
}
