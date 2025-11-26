namespace AIEvent.Application.Services.Interfaces
{
    public interface IOpenRouterLLMService
    {
        Task<string> GenerateTextAsync(string prompt);
        Task<string> GenerateRAGResponseAsync(string query, List<string> contexts, List<(string prompt, string response)>? chatHistory = null);
        Task<string> GenerateSessionNameAsync(string prompt);
        Task<string> GenerateShortReasonAsync(string prompt);
    }
}
