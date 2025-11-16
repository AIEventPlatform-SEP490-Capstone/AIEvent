using Newtonsoft.Json;

namespace AIEvent.Application.DTOs.PineconeVector
{
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
