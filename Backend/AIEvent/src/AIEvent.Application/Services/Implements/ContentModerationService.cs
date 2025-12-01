using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

namespace AIEvent.Application.Services.Implements
{
    public class ContentModerationService : IContentModerationService
    {
        private readonly HttpClient _httpClient;
        private readonly string _model;
        private readonly string _apiKey;

        public ContentModerationService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _model = config["AIProviders:Gemini:Model"]!;
            _apiKey = config["AIProviders:Gemini:ApiKey"]!;
        }

        public async Task<Result<string>> ProfanityChecker(string jsonObject)
        {
            if (string.IsNullOrWhiteSpace(jsonObject))
                return ErrorResponse.FailureResult("Input cannot be empty", ErrorCodes.InvalidInput);

            try
            {
                var prompt = $$"""
                You are a strict JSON-only content moderator. 
                Analyze the JSON below and return ONLY a valid JSON array of field names containing profanity, hate speech, or inappropriate content.

                RULES:
                - Return ONLY the JSON array. No text, no markdown, no explanation.
                - Use double quotes. Valid examples: [], ["bio"], ["title", "comment"]
                - If clean, return exactly: []

                JSON:
                {{jsonObject}}
                """;

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    }
                };

                var requestJson = JsonSerializer.Serialize(requestBody);
                var request = new HttpRequestMessage(HttpMethod.Post,
                    $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}")
                {
                    Content = new StringContent(requestJson, Encoding.UTF8, "application/json")
                };

                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return ErrorResponse.FailureResult($"Gemini API error: {content}", ErrorCodes.InternalServerError);

                using var respDoc = JsonDocument.Parse(content);
                var text = respDoc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString()?.Trim();

                if (string.IsNullOrWhiteSpace(text))
                    return null!;

                try
                {
                    var invalidFields = JsonSerializer.Deserialize<string[]>(text)
                                        ?? Array.Empty<string>();

                    if (invalidFields.Length > 0)
                    {
                        var msg = $"Inappropriate language detected in field(s): {string.Join(", ", invalidFields)}";
                        return ErrorResponse.FailureResult(msg, ErrorCodes.InvalidInput);
                    }

                    return Result<string>.Success(null!);
                }
                catch (JsonException)
                {
                    return ErrorResponse.FailureResult(
                        "Content moderation failed: AI returned invalid JSON format.",
                        ErrorCodes.InternalServerError);
                }
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Unexpected error: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }
    }
}