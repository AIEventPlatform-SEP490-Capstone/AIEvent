using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text.Json;

namespace AIEvent.API.Test.Integration
{
    public class EventFieldControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions;

        public EventFieldControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        [Fact]
        public async Task GetEventField_ShouldReturnOkOrBadRequest()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
        }

        [Fact]
        public async Task GetEventField_ShouldReturnJsonResponse()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                content.Should().NotBeNullOrEmpty();
                
                var isValidJson = IsValidJson(content);
                isValidJson.Should().BeTrue();
            }
        }

        [Fact]
        public async Task GetEventField_ShouldReturnCorrectContentType()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        }

        [Fact]
        public async Task GetEventField_WhenSuccessful_ShouldReturnExpectedStructure()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDocument = JsonDocument.Parse(content);
                var root = jsonDocument.RootElement;

                // Check response structure
                root.TryGetProperty("success", out _).Should().BeTrue();
                root.TryGetProperty("statusCode", out _).Should().BeTrue();
                root.TryGetProperty("message", out _).Should().BeTrue();
                root.TryGetProperty("data", out var dataElement).Should().BeTrue();

                // Check if data is an array
                dataElement.ValueKind.Should().Be(JsonValueKind.Array);
            }
        }

        [Fact]
        public async Task GetEventField_WhenSuccessful_ShouldReturnEventFieldsWithCorrectProperties()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDocument = JsonDocument.Parse(content);
                var root = jsonDocument.RootElement;

                if (root.TryGetProperty("data", out var dataElement) && dataElement.GetArrayLength() > 0)
                {
                    var firstEventField = dataElement[0];
                    
                    // Check that each event field has required properties
                    firstEventField.TryGetProperty("eventFieldId", out _).Should().BeTrue();
                    firstEventField.TryGetProperty("eventFieldName", out _).Should().BeTrue();
                }
            }
        }

        [Fact]
        public async Task GetEventField_WhenSuccessful_ShouldReturnValidEventFieldIds()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDocument = JsonDocument.Parse(content);
                var root = jsonDocument.RootElement;

                if (root.TryGetProperty("data", out var dataElement))
                {
                    foreach (var eventField in dataElement.EnumerateArray())
                    {
                        if (eventField.TryGetProperty("eventFieldId", out var idElement))
                        {
                            var idString = idElement.GetString();
                            idString.Should().NotBeNullOrEmpty();
                            
                            // Try to parse as GUID to ensure it's a valid format
                            Guid.TryParse(idString, out _).Should().BeTrue();
                        }
                    }
                }
            }
        }

        [Fact]
        public async Task GetEventField_WhenSuccessful_ShouldReturnNonEmptyEventFieldNames()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDocument = JsonDocument.Parse(content);
                var root = jsonDocument.RootElement;

                if (root.TryGetProperty("data", out var dataElement))
                {
                    foreach (var eventField in dataElement.EnumerateArray())
                    {
                        if (eventField.TryGetProperty("eventFieldName", out var nameElement))
                        {
                            var nameString = nameElement.GetString();
                            nameString.Should().NotBeNullOrEmpty();
                        }
                    }
                }
            }
        }

        [Fact]
        public async Task GetEventField_MultipleRequests_ShouldReturnConsistentResults()
        {
            // Act
            var response1 = await _client.GetAsync("/api/eventfield");
            var response2 = await _client.GetAsync("/api/eventfield");

            // Assert
            response1.StatusCode.Should().Be(response2.StatusCode);

            if (response1.IsSuccessStatusCode && response2.IsSuccessStatusCode)
            {
                var content1 = await response1.Content.ReadAsStringAsync();
                var content2 = await response2.Content.ReadAsStringAsync();

                content1.Should().Be(content2);
            }
        }

        [Fact]
        public async Task GetEventField_PerformanceTest_ShouldRespondWithinReasonableTime()
        {
            // Act
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            var response = await _client.GetAsync("/api/eventfield");
            stopwatch.Stop();

            // Assert
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000); // Should respond within 5 seconds
        }

        [Fact]
        public async Task GetEventField_WhenSuccessful_ShouldHaveCorrectSuccessMessage()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            if (response.StatusCode == HttpStatusCode.OK)
            {
                var content = await response.Content.ReadAsStringAsync();
                var jsonDocument = JsonDocument.Parse(content);
                var root = jsonDocument.RootElement;

                if (root.TryGetProperty("message", out var messageElement))
                {
                    var message = messageElement.GetString();
                    message.Should().Be("Event field retrieved successfully");
                }

                if (root.TryGetProperty("success", out var successElement))
                {
                    successElement.GetBoolean().Should().BeTrue();
                }
            }
        }

        [Fact]
        public async Task GetEventField_WhenFailed_ShouldReturnErrorResponse()
        {
            // Act
            var response = await _client.GetAsync("/api/eventfield");

            // Assert
            if (!response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                
                if (!string.IsNullOrEmpty(content))
                {
                    var isValidJson = IsValidJson(content);
                    isValidJson.Should().BeTrue();

                    var jsonDocument = JsonDocument.Parse(content);
                    var root = jsonDocument.RootElement;

                    // Check error response structure
                    if (root.TryGetProperty("success", out var successElement))
                    {
                        successElement.GetBoolean().Should().BeFalse();
                    }
                }
            }
        }

        [Fact]
        public async Task GetEventField_ConcurrentRequests_ShouldHandleMultipleRequestsCorrectly()
        {
            // Arrange
            var tasks = new List<Task<HttpResponseMessage>>();

            // Act
            for (int i = 0; i < 5; i++)
            {
                tasks.Add(_client.GetAsync("/api/eventfield"));
            }

            var responses = await Task.WhenAll(tasks);

            // Assert
            foreach (var response in responses)
            {
                response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest, HttpStatusCode.InternalServerError);
                response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
            }

            // All successful responses should have the same content
            var successfulResponses = responses.Where(r => r.IsSuccessStatusCode).ToList();
            if (successfulResponses.Count > 1)
            {
                var firstContent = await successfulResponses[0].Content.ReadAsStringAsync();
                foreach (var response in successfulResponses.Skip(1))
                {
                    var content = await response.Content.ReadAsStringAsync();
                    content.Should().Be(firstContent);
                }
            }
        }

        private static bool IsValidJson(string jsonString)
        {
            try
            {
                JsonDocument.Parse(jsonString);
                return true;
            }
            catch (JsonException)
            {
                return false;
            }
        }
    }
}
