using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class PineconeVectorService : IPineconeVectorService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _host;

        public PineconeVectorService(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = config["AIProviders:Pinecone:ApiKey"]!;
            _host = config["AIProviders:Pinecone:HostEvent"]!;

            _httpClient.BaseAddress = new Uri(_host);
            _httpClient.DefaultRequestHeaders.Add("Api-Key", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task UpsertVectorAsync(string id, float[] values, Dictionary<string, object>? metadata = null)
        {
            var payload = new
            {
                vectors = new[]
                {
                new
                {
                    id,
                    values,
                    metadata
                }
            }
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/vectors/upsert", content);
            response.EnsureSuccessStatusCode();
        }

        public async Task UpsertVectorAsync(IEnumerable<PineconeVector> vectors)
        {
            var payload = new
            {
                vectors = vectors.Select(v => new
                {
                    id = v.Id,
                    values = v.Values,
                    metadata = v.Metadata
                }).ToArray()
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/vectors/upsert", content);

            response.EnsureSuccessStatusCode();
        }

        public async Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarAsync(float[] vector, int topK = 5)
        {
            var payload = new
            {
                vector,
                topK,
                includeMetadata = true
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/query", content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<PineconeQueryResponse>(json)!;

            var matches = result.Matches?
                .Select(m => (m.Id, m.Score, m.Metadata))
                .ToList() ?? new List<(string, double, Dictionary<string, object>?)>();

            return matches;
        }

        public async Task DeleteVectorAsync(string id)
        {
            var payload = new { ids = new[] { id } };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/vectors/delete", content);
            response.EnsureSuccessStatusCode();
        }

    }

    public class PineconeQueryResponse
    {
        [JsonProperty("matches")]
        public List<PineconeMatch>? Matches { get; set; }
    }

    public class PineconeMatch
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        [JsonProperty("score")]
        public double Score { get; set; }

        [JsonProperty("metadata")]
        public Dictionary<string, object>? Metadata { get; set; }
    }
}
