namespace AIEvent.Application.Services.Interfaces
{
    public interface IOpenRouterLLMService
    {
        Task<string> GenerateTextAsync(string prompt);
        Task<string> GenerateRAGResponseAsync(string query, List<string> contexts);
    }
}
