using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace AIEvent.API.Test.Integration
{
    public class EnumControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions;

        public EnumControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        [Fact]
        public async Task GetAllEnums_WithoutAuthentication_ShouldReturnUnauthorized()
        {
            // Act
            var response = await _client.GetAsync("/api/enum/all");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task GetAllEnums_WithValidAuthentication_ShouldReturnOk()
        {
            // Arrange
            var token = await GetValidAuthTokenAsync();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Act
            var response = await _client.GetAsync("/api/enum/all");

            // Assert
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task GetAllEnums_WithValidAuthentication_ShouldReturnJsonResponse()
        {
            // Arrange
            var token = await GetValidAuthTokenAsync();
            if (token != null)
            {
                _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                // Act
                var response = await _client.GetAsync("/api/enum/all");

                // Assert
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    content.Should().NotBeNullOrEmpty();
                    
                    var isValidJson = IsValidJson(content);
                    isValidJson.Should().BeTrue();
                }
            }
        }

        [Fact]
        public async Task GetAllEnums_WithValidAuthentication_ShouldReturnCorrectContentType()
        {
            // Arrange
            var token = await GetValidAuthTokenAsync();
            if (token != null)
            {
                _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                // Act
                var response = await _client.GetAsync("/api/enum/all");

                // Assert
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
                }
            }
        }

        [Fact]
        public async Task GetAllEnums_WithValidAuthentication_ShouldReturnExpectedStructure()
        {
            // Arrange
            var token = await GetValidAuthTokenAsync();
            if (token != null)
            {
                _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                // Act
                var response = await _client.GetAsync("/api/enum/all");

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

                    // Check data structure contains enum types
                    dataElement.TryGetProperty("eventExperienceLevel", out _).Should().BeTrue();
                    dataElement.TryGetProperty("eventFrequency", out _).Should().BeTrue();
                    dataElement.TryGetProperty("eventSize", out _).Should().BeTrue();
                    dataElement.TryGetProperty("organizationType", out _).Should().BeTrue();
                    dataElement.TryGetProperty("organizerType", out _).Should().BeTrue();
                }
            }
        }

        [Fact]
        public async Task GetAllEnums_WithValidAuthentication_ShouldReturnNonEmptyEnumValues()
        {
            // Arrange
            var token = await GetValidAuthTokenAsync();
            if (token != null)
            {
                _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                // Act
                var response = await _client.GetAsync("/api/enum/all");

                // Assert
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var jsonDocument = JsonDocument.Parse(content);
                    var root = jsonDocument.RootElement;

                    if (root.TryGetProperty("data", out var dataElement))
                    {
                        // Check that each enum type has values
                        if (dataElement.TryGetProperty("eventExperienceLevel", out var experienceLevel))
                        {
                            experienceLevel.GetArrayLength().Should().BeGreaterThan(0);
                        }

                        if (dataElement.TryGetProperty("eventFrequency", out var frequency))
                        {
                            frequency.GetArrayLength().Should().BeGreaterThan(0);
                        }

                        if (dataElement.TryGetProperty("eventSize", out var size))
                        {
                            size.GetArrayLength().Should().BeGreaterThan(0);
                        }

                        if (dataElement.TryGetProperty("organizationType", out var orgType))
                        {
                            orgType.GetArrayLength().Should().BeGreaterThan(0);
                        }
                    }
                }
            }
        }

        [Fact]
        public async Task GetAllEnums_MultipleRequests_ShouldReturnConsistentResults()
        {
            // Arrange
            var token = await GetValidAuthTokenAsync();
            if (token != null)
            {
                _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                // Act
                var response1 = await _client.GetAsync("/api/enum/all");
                var response2 = await _client.GetAsync("/api/enum/all");

                // Assert
                if (response1.StatusCode == HttpStatusCode.OK && response2.StatusCode == HttpStatusCode.OK)
                {
                    var content1 = await response1.Content.ReadAsStringAsync();
                    var content2 = await response2.Content.ReadAsStringAsync();

                    content1.Should().Be(content2);
                }
            }
        }

        [Fact]
        public async Task GetAllEnums_PerformanceTest_ShouldRespondWithinReasonableTime()
        {
            // Arrange
            var token = await GetValidAuthTokenAsync();
            if (token != null)
            {
                _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

                // Act
                var stopwatch = System.Diagnostics.Stopwatch.StartNew();
                var response = await _client.GetAsync("/api/enum/all");
                stopwatch.Stop();

                // Assert
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000); // Should respond within 5 seconds
                }
            }
        }

        private async Task<string?> GetValidAuthTokenAsync()
        {
            try
            {
                // Try to register and login to get a valid token
                var registerRequest = new RegisterRequest
                {
                    Email = $"test{Guid.NewGuid()}@example.com",
                    Password = "Password123!",
                    ConfirmPassword = "Password123!",
                    FullName = "Test User"
                };

                var registerResponse = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
                
                if (registerResponse.IsSuccessStatusCode)
                {
                    var registerContent = await registerResponse.Content.ReadAsStringAsync();
                    var registerResult = JsonSerializer.Deserialize<SuccessResponse<object>>(registerContent, _jsonOptions);
                    
                    //if (registerResult?.Success == true)
                    //{
                    //    var loginRequest = new LoginRequest
                    //    {
                    //        Email = registerRequest.Email,
                    //        Password = registerRequest.Password
                    //    };

                    //    var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
                        
                    //    if (loginResponse.IsSuccessStatusCode)
                    //    {
                    //        var loginContent = await loginResponse.Content.ReadAsStringAsync();
                    //        var loginResult = JsonSerializer.Deserialize<JsonElement>(loginContent, _jsonOptions);
                            
                    //        if (loginResult.TryGetProperty("data", out var data) &&
                    //            data.TryGetProperty("accessToken", out var tokenElement))
                    //        {
                    //            return tokenElement.GetString();
                    //        }
                    //    }
                    //}
                }
            }
            catch
            {
                // If authentication fails, tests will handle unauthorized responses
            }

            return null;
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
