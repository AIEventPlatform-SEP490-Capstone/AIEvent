using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventService
    {
        Task<Result> CreateEventAsync(Guid organizerId, CreateEventRequest request);
        Task<Result<EventDetailResponse>> GetEventByIdAsync(string eventId);
        Task<Result> DeleteEventAsync(string eventId);
        Task<Result<BasePaginated<EventsResponse>>> GetEventAsync(string? search, string? eventCategoryId, List<EventTagRequest> tags, TicketType? ticketType, string? city, TimeLine? timeLine, int pageNumber = 1, int pageSize = 5);
    }
}
