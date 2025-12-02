using AIEvent.Application.DTOs.PineconeVector;
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
        private readonly string _hostEvent;
        private readonly string _hostUser;

        public PineconeVectorService(IConfiguration config, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = config["AIProviders:Pinecone:ApiKey"]!;
            _hostEvent = config["AIProviders:Pinecone:HostEvent"]!;
            _hostUser = config["AIProviders:Pinecone:HostUser"]!;
             
            _httpClient.DefaultRequestHeaders.Add("Api-Key", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        private string GetHost(bool isUser = false) => isUser ? _hostUser : _hostEvent;

        public async Task UpsertVectorAsync(string id, float[] values, bool isUser, Dictionary<string, object>? metadata = null)
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
            var url = $"{GetHost(isUser)}/vectors/upsert";
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
        }

        public async Task UpsertVectorAsync(IEnumerable<PineconeVector> vectors, bool isUser)
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
            var url = $"{GetHost(isUser)}/vectors/upsert";
            var response = await _httpClient.PostAsync(url, content);

            response.EnsureSuccessStatusCode();
        }

        public async Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarAsync(float[] vector, bool isUser, int topK = 5)
        {
            var payload = new
            {
                vector,
                topK,
                includeMetadata = true
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var url = $"{GetHost(isUser)}/query";
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<PineconeQueryResponse>(json)!;

            var matches = result.Matches?
                .Select(m => (m.Id, m.Score, m.Metadata))
                .ToList() ?? new List<(string, double, Dictionary<string, object>?)>();

            return matches;
        }

        public async Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarFriendAsync(
            float[] vector,
            bool isUser,
            int topK = 5,
            List<string>? excludeIds = null)
        {
            Dictionary<string, object>? filter = null;
            if (excludeIds != null && excludeIds.Count > 0)
            {
                filter = new Dictionary<string, object>
                {
                    ["userId"] = new Dictionary<string, object>
                    {
                        ["$nin"] = excludeIds
                    }
                };
            }

            var payload = new
            {
                vector,
                topK,
                includeMetadata = true,
                filter
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var url = $"{GetHost(isUser)}/query";
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<PineconeQueryResponse>(json)!;

            var matches = result.Matches?
                .Select(m => (m.Id, m.Score, m.Metadata))
                .ToList() ?? new List<(string, double, Dictionary<string, object>?)>();

            return matches;
        }

        public async Task<List<(string Id, double Score, Dictionary<string, object>? Metadata)>> QuerySimilarFriendInEventAsync(
            float[] vector,
            bool isUser,
            int topK = 5,
            List<string>? excludeIds = null,
            List<string>? includeIds = null)
        {
            var payload = new
            {
                vector,
                topK = 20,
                includeMetadata = true
            };

            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var url = $"{GetHost(isUser)}/query";
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<PineconeQueryResponse>(json)!;

            var rawMatches = result.Matches?
                .Select(m => (m.Id, m.Score, m.Metadata))
                .ToList() ?? new List<(string, double, Dictionary<string, object>?)>();


            if (excludeIds != null && excludeIds.Count > 0)
            {
                rawMatches = rawMatches
                    .Where(r => !excludeIds.Contains(r.Id))
                    .ToList();
            }

            if (includeIds != null && includeIds.Count > 0)
            {
                rawMatches = rawMatches
                    .Where(r => includeIds.Contains(r.Id))
                    .ToList();
            }

            var finalMatches = rawMatches
                .Take(topK)
                .ToList();

            return finalMatches;
        }



        public async Task DeleteVectorAsync(string id, bool isUser)
        {
            var payload = new { ids = new[] { id } };
            var content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            var url = $"{GetHost(isUser)}/vectors/delete";
            var response = await _httpClient.PostAsync(url, content);
            response.EnsureSuccessStatusCode();
        }

    }
}
