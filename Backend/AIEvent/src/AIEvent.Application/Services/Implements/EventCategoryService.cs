using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.EventCategory;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
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

        public async Task<Result> CreateEventCategoryAsync(CreateCategoryRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
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
                var categoryId = Guid.Parse(id);
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



        public async Task<Result<EventCategoryResponse>> UpdateEventCategoryAsync(string id, CreateCategoryRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var categoryId = Guid.Parse(id);
                var category = await _unitOfWork.EventCategoryRepository
                                            .Query()
                                            .FirstOrDefaultAsync(t => t.Id == categoryId);

                if (category == null || category.DeletedAt.HasValue)
                {
                    return ErrorResponse.FailureResult("Can not found or EventCategory is deleted", ErrorCodes.InvalidInput);
                }

                category.CategoryName = request.EventCategoryName;

                await _unitOfWork.EventCategoryRepository.UpdateAsync(category);

                var response = new EventCategoryResponse
                {
                    EventCategoryId = category.Id.ToString(),
                    EventCategoryName = category.CategoryName,
                };

                return Result<EventCategoryResponse>.Success(response);
            });
        }
    }
}
