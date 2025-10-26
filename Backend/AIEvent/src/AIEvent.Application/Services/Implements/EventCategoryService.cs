using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.EventCategory;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class EventCategoryService : IEventCategoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;

        public EventCategoryService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper)
        {
            _transactionHelper = transactionHelper;
            _unitOfWork = unitOfWork;
        }

        public async Task<Result> CreateEventCategoryAsync(EventCategoryRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (string.IsNullOrWhiteSpace(request.EventCategoryName))
                {
                    return ErrorResponse.FailureResult("Event category name is required", ErrorCodes.InvalidInput);
                }

                var existingCategory = await _unitOfWork.EventCategoryRepository
                                            .Query()
                                            .FirstOrDefaultAsync(t => t.CategoryName.ToLower() == request.EventCategoryName.ToLower());
                if (existingCategory != null)
                {
                    return ErrorResponse.FailureResult("EventCateogry is already existing", ErrorCodes.InvalidInput);
                }

                EventCategory eventCategory = new()
                {
                    CategoryName = request.EventCategoryName,
                };

                await _unitOfWork.EventCategoryRepository.AddAsync(eventCategory);

                return Result.Success();
            });
        }


        public async Task<Result> DeleteEventCategoryAsync(string id)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (!Guid.TryParse(id, out var categoryId))
                {
                    return ErrorResponse.FailureResult("Invalid Guid format", ErrorCodes.InvalidInput);
                }

                var category = await _unitOfWork.EventCategoryRepository
                                            .Query()
                                            .FirstOrDefaultAsync(t => t.Id == categoryId);

                if (category == null || category.DeletedAt.HasValue)
                {
                    return ErrorResponse.FailureResult("Can not found or EventCategory is deleted", ErrorCodes.InvalidInput);
                }

                await _unitOfWork.EventCategoryRepository.DeleteAsync(category);

                return Result.Success();
            });
        }


        public async Task<Result<EventCategoryResponse>> GetEventCategoryByIdAsync(string id)
        {
            var categoryId = Guid.Parse(id);
            var category = await _unitOfWork.EventCategoryRepository
                                .Query()
                                .AsNoTracking()
                                .FirstOrDefaultAsync(t => t.Id == categoryId);

            if (category == null || category.DeletedAt.HasValue)
            {
                return ErrorResponse.FailureResult("Can not found or EventCategory is deleted", ErrorCodes.InvalidInput);
            }

            EventCategoryResponse response = new()
            {
                EventCategoryId = category.Id.ToString(),
                EventCategoryName = category.CategoryName,
            };

            return Result<EventCategoryResponse>.Success(response);
        }


        public async Task<Result<BasePaginated<EventCategoryResponse>>> GetListCategoryAsync(int pageNumber, int pageSize)
        {
            IQueryable<EventCategory> categoryQuery = _unitOfWork.EventCategoryRepository
                .Query()
                .AsNoTracking()
                .Where(p => !p.DeletedAt.HasValue)
                .OrderByDescending(s => s.CreatedAt);

            int totalCount = await categoryQuery.CountAsync();

            var result = await categoryQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new EventCategoryResponse
                {
                    EventCategoryId = p.Id.ToString(),
                    EventCategoryName = p.CategoryName,
                })
                .ToListAsync();

            return new BasePaginated<EventCategoryResponse>(result, totalCount, pageNumber, pageSize);
        }



        public async Task<Result<EventCategoryResponse>> UpdateEventCategoryAsync(string id, EventCategoryRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if (!Guid.TryParse(id, out var categoryId))
                    return ErrorResponse.FailureResult("Invalid category ID format", ErrorCodes.InvalidInput);

                if (string.IsNullOrWhiteSpace(request.EventCategoryName))
                    return ErrorResponse.FailureResult("Event category name is required", ErrorCodes.InvalidInput);

                var normalizedName = request.EventCategoryName.Trim().ToUpper();

                var category = await _unitOfWork.EventCategoryRepository
                    .Query()
                    .FirstOrDefaultAsync(t => t.Id == categoryId && !t.DeletedAt.HasValue);

                if (category == null)
                    return ErrorResponse.FailureResult("Event category not found", ErrorCodes.NotFound);

                var isNameTaken = await _unitOfWork.EventCategoryRepository
                    .Query()
                    .AnyAsync(t => t.Id != categoryId
                                && t.CategoryName.ToUpper() == normalizedName
                                && !t.DeletedAt.HasValue);

                if (isNameTaken)
                    return ErrorResponse.FailureResult("Event category name already exists", ErrorCodes.InvalidInput);

                // Update
                category.CategoryName = request.EventCategoryName.Trim();

                await _unitOfWork.EventCategoryRepository.UpdateAsync(category);

                return Result<EventCategoryResponse>.Success(new EventCategoryResponse
                {
                    EventCategoryId = category.Id.ToString(),
                    EventCategoryName = category.CategoryName
                });
            });
        }

    }
}
