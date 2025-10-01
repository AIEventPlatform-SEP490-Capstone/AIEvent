using System.Text.Json.Serialization;

namespace AIEvent.Application.DTOs.Common
{
    public class BaseResponse
    {
        [JsonPropertyOrder(0)]
        public string StatusCode { get; set; } = string.Empty;
        [JsonPropertyOrder(1)]
        public string Message { get; set; } = string.Empty;
    }
}
