using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventRecommendationService
    {
        Task<Result<string>> RecommendEventsAsync(string userPrompt, Guid? userId = null, Guid? sessionId = null, int topK = 5);
        Task<Result<BasePaginated<EventsResponse>>> GetEventAIRecommendAsync(int pageNumber, int pageSize, Guid userId);
        Task<Result<BasePaginated<ChatLogResponse>>> GetChatHistoryAsync(Guid userId, Guid? sessionId = null, int pageNumber = 1, int pageSize = 10);
        Task<Result<BasePaginated<SessionResponse>>> GetSessionsAsync(Guid userId, int pageNumber = 1, int pageSize = 10);
        Task<Result> DeleteSessionAsync(Guid userId, Guid sessionId);
    }
}
