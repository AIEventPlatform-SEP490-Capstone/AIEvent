using AIEvent.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class OpenRouterLLMService : IOpenRouterLLMService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public OpenRouterLLMService(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = config["AIProviders:OpenRouter:ApiKey"]!;
            _model = config["AIProviders:OpenRouter:Model"]!;
        }

        public async Task<string> GenerateTextAsync(string prompt)
        {
            var requestBody = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = "Bạn là một trợ lý AI gợi ý sự kiện thông minh, hỗ trợ gợi ý sự kiện cho người dùng." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.7
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync();
            var json = await JsonDocument.ParseAsync(stream);
            var content = json.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return content ?? string.Empty;
        }

        /// <summary>
        /// Sinh câu trả lời RAG: dùng context từ Pinecone.
        /// </summary>
        public async Task<string> GenerateRAGResponseAsync(string query, List<string> contexts)
        {
            var contextText = string.Join("\n---\n", contexts);

            var prompt = $@"
                Người dùng hỏi: ""{query}"".

                Dưới đây là danh sách sự kiện liên quan (ngữ cảnh):
                {contextText}

                Hãy gợi ý các sự kiện phù hợp nhất, tóm tắt ngắn gọn lý do và thông tin cơ bản (tên, địa điểm, giá, thời gian).
                ";

            return await GenerateTextAsync(prompt);
        }
    }
}
