using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AIEvent.Application.Services.Implements
{
    public class OpenRouterClient: IOpenRouterClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public OpenRouterClient(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        public async Task<Result<string>> GetRecommendationsAsync(UserNeedRecommendation user, List<EventRecommendation> events)
        {
            var payload = new
            {
                model = "google/gemini-1.5-flash",
                messages = new[]
                {
                new { role = "system", content = "You are an AI assistant recommending events." },
                new { role = "user", content = $"User profile: {JsonSerializer.Serialize(user)}" },
                new { role = "user", content = $"Events: {JsonSerializer.Serialize(events)}" },
                new { role = "user", content = "Recommend top 3 relevant events for this user." }
            }
            };

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _config["OpenRouter:ApiKey"]);

            var response = await _httpClient.PostAsync(
                "https://openrouter.ai/api/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));

            return await response.Content.ReadAsStringAsync();
        }
    }
}
