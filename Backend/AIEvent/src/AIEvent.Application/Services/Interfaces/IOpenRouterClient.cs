using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IOpenRouterClient
    {
        Task<Result<string>> GetRecommendationsAsync(UserNeedRecommendation user, List<EventRecommendation> events);
    }
}
