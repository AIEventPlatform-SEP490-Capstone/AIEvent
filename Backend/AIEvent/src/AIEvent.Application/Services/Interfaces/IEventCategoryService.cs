using AIEvent.Application.DTOs.EventCategory;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventCategoryService
    {
        Task<Result> CreateEventCategoryAsync(EventCategoryRequest request);
        Task<Result> DeleteEventCategoryAsync(string id);
        Task<Result<EventCategoryResponse>> GetEventCategoryByIdAsync(string id);
        Task<Result<BasePaginated<EventCategoryResponse>>> GetListCategoryAsync(int pageNumber, int pageSize);
        Task<Result<EventCategoryResponse>> UpdateEventCategoryAsync(string id, EventCategoryRequest request);
    }
}
