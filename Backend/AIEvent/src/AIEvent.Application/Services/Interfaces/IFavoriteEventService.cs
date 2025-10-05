using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IFavoriteEventService
    {
        Task<Result> AddFavoriteEvent(Guid userId, Guid eventId);
        Task<Result> RemoveFavoriteEvent(Guid userId, Guid eventId);
        Task<Result<BasePaginated<EventsResponse>>> GetFavoriteEvent(Guid userId,
                                                                                string? search,
                                                                                string? eventCategoryId,
                                                                                int pageNumber = 1,
                                                                                int pageSize = 5);
    }
}
