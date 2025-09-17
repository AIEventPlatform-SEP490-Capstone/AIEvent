using System.Text.Json.Serialization;

namespace AIEvent.Application.DTO.Common
{
    public class BaseResponse
    {
        [JsonPropertyOrder(0)]
        public bool Success { get; set; }
        [JsonPropertyOrder(1)]
        public string StatusCode { get; set; } = string.Empty;
        [JsonPropertyOrder(2)]
        public string Message { get; set; } = string.Empty;
    }
}
