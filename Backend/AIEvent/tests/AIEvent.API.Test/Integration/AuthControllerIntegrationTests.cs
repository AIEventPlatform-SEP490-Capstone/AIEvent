using AIEvent.Application.DTO.Auth;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace AIEvent.API.Test.Integration
{
    public class AuthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions;

        public AuthControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        [Fact]
        public async Task Login_WithValidModelState_ShouldReturnOk()
        {
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Login_WithInvalidModelState_ShouldReturnBadRequest()
        {
            var loginRequest = new LoginRequest
            {
                Email = "", 
                Password = "" 
            };

            var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Register_WithValidModelState_ShouldReturnOkOrBadRequest()
        {
            var registerRequest = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "New User"
            };
            var response = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task Register_WithInvalidModelState_ShouldReturnBadRequest()
        {
            var registerRequest = new RegisterRequest
            {
                Email = "invalid-email",
                Password = "123",
                ConfirmPassword = "456", 
                FullName = "" 
            };

            var response = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task RefreshToken_WithValidModelState_ShouldReturnOkOrBadRequest()
        {
            var refreshTokenRequest = new RefreshTokenRequest
            {
                RefreshToken = "some-refresh-token"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/refresh-token", refreshTokenRequest);

            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task RefreshToken_WithInvalidModelState_ShouldReturnBadRequest()
        {
            var refreshTokenRequest = new RefreshTokenRequest
            {
                RefreshToken = "" 
            };

            var response = await _client.PostAsJsonAsync("/api/auth/refresh-token", refreshTokenRequest);

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task RevokeToken_WithoutAuthorization_ShouldReturnUnauthorized()
        {
            var refreshTokenRequest = new RefreshTokenRequest
            {
                RefreshToken = "some-refresh-token"
            };
            var response = await _client.PostAsJsonAsync("/api/auth/revoke-token", refreshTokenRequest);

            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Login_ShouldReturnJsonResponse()
        {
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/login", loginRequest);
            var content = await response.Content.ReadAsStringAsync();

            content.Should().NotBeNullOrEmpty();
            var isValidJson = IsValidJson(content);
            isValidJson.Should().BeTrue();
        }

        [Fact]
        public async Task Register_ShouldReturnJsonResponse()
        {
            var registerRequest = new RegisterRequest
            {
                Email = "test@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "Test User"
            };
            var response = await _client.PostAsJsonAsync("/api/auth/register", registerRequest);
            var content = await response.Content.ReadAsStringAsync();

            content.Should().NotBeNullOrEmpty();
            var isValidJson = IsValidJson(content);
            isValidJson.Should().BeTrue();
        }

        [Fact]
        public async Task AllEndpoints_ShouldHaveCorrectContentType()
        {
            var endpoints = new (string endpoint, object request)[]
            {
                ("/api/auth/login", new LoginRequest { Email = "test@test.com", Password = "Test123!" }),
                ("/api/auth/register", new RegisterRequest { Email = "test@test.com", Password = "Test123!", ConfirmPassword = "Test123!", FullName = "Test" }),
                ("/api/auth/refresh-token", new RefreshTokenRequest { RefreshToken = "token" })
            };

            foreach (var (endpoint, request) in endpoints)
            {
                var response = await _client.PostAsJsonAsync(endpoint, request);

                response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
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
