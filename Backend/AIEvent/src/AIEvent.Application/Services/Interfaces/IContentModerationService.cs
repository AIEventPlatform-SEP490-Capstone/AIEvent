using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IContentModerationService
    {
        Task<Result<string>> ProfanityChecker(string jsonObject);
    }
}
