using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventService
    {
        Task<Result> CreateEvent(Guid organizerId, CreateEventRequest request);
        Task<Result<EventResponse>> GetEventById(string eventId);
    }
}
