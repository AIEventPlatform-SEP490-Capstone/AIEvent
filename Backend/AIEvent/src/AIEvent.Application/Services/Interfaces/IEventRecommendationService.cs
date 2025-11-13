using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventRecommendationService
    {
        Task<Result<string>> RecommendEventsAsync(string userPrompt, int topK = 5);
        Task<Result<BasePaginated<EventsResponse>>> GetEventAIRecommendAsync(int pageNumber, int pageSize, Guid userId);
    }
}
