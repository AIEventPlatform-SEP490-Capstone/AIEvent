using AIEvent.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class VoyageEmbeddingService : IVoyageEmbeddingService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private readonly string _projectId;

        public VoyageEmbeddingService(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = config["AIProviders:Voyage:ApiKey"]!;
            _model = config["AIProviders:Voyage:EmbeddingModel"] ?? "voyage-large-2";
            _projectId = config["AIProviders:Voyage:ProjectId"]!;
        }

        public async Task<float[]> GetEmbeddingAsync(string input)
        {
            var requestBody = new
            {
                model = _model,
                input = new[] { input }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json"
            );

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);

            // 🔹 Với key pa-xxx thì BẮT BUỘC phải có header này
            _httpClient.DefaultRequestHeaders.Add("X-Project-ID", _projectId);

            var response = await _httpClient.PostAsync("https://api.voyageai.com/v1/embeddings", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Voyage embedding error: {response.StatusCode} - {responseBody}");
            }

            using var doc = JsonDocument.Parse(responseBody);
            var embedding = doc.RootElement
                .GetProperty("data")[0]
                .GetProperty("embedding")
                .EnumerateArray()
                .Select(x => x.GetSingle())
                .ToArray();

            return embedding;
        }
    }
}
