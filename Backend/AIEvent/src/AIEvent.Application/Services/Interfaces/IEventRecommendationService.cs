namespace AIEvent.Application.Services.Interfaces
{
    public interface IEventRecommendationService
    {
        Task<string> RecommendEventsAsync(string userPrompt, int topK = 5);
    }
}
