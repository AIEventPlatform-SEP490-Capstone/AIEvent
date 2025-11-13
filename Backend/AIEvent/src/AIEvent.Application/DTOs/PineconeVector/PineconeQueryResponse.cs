using Newtonsoft.Json;

namespace AIEvent.Application.DTOs.PineconeVector
{
    public class PineconeQueryResponse
    {
        [JsonProperty("matches")]
        public List<PineconeMatch>? Matches { get; set; }
    }
}
