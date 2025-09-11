using AIEvent.API.Controllers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTO.Auth;
using AIEvent.Application.DTO.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AIEvent.API.Test.Controllers
{
    public class AuthControllerTests
    {
        private readonly Mock<IAuthService> _mockAuthService;
        private readonly AuthController _authController;

        public AuthControllerTests()
        {
            _mockAuthService = new Mock<IAuthService>();
            _authController = new AuthController(_mockAuthService.Object);
        }

        [Fact]
        public async Task Login_WithValidCredentials_ShouldReturnOkWithSuccessResponse()
        {
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            var authResponse = new AuthResponse
            {
                AccessToken = "mock-access-token",
                RefreshToken = "mock-refresh-token",
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            var serviceResult = Result<AuthResponse>.Success(authResponse);
            _mockAuthService.Setup(x => x.LoginAsync(loginRequest))
                .ReturnsAsync(serviceResult);

            var result = await _authController.Login(loginRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<AuthResponse>>();

            var successResponse = okResult.Value as SuccessResponse<AuthResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.AccessToken.Should().Be("mock-access-token");
            successResponse.Data.RefreshToken.Should().Be("mock-refresh-token");

            _mockAuthService.Verify(x => x.LoginAsync(loginRequest), Times.Once);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ShouldReturnBadRequestWithErrorResponse()
        {
            var loginRequest = new LoginRequest
            {
                Email = "invalid@example.com",
                Password = "WrongPassword"
            };

            var errorResponse = ErrorResponse.FailureResult(
                "Invalid email or password",
                ErrorCodes.Unauthorized);

            var serviceResult = Result<AuthResponse>.Failure(errorResponse);
            _mockAuthService.Setup(x => x.LoginAsync(loginRequest))
                .ReturnsAsync(serviceResult);

            var result = await _authController.Login(loginRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Invalid email or password");
            errorResponseResult.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockAuthService.Verify(x => x.LoginAsync(loginRequest), Times.Once);
        }

        [Fact]
        public async Task Register_WithValidData_ShouldReturnOkWithSuccessResponse()
        {
            var registerRequest = new RegisterRequest
            {
                Email = "newuser@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "New User"
            };

            var authResponse = new AuthResponse
            {
                AccessToken = "mock-access-token",
                RefreshToken = "mock-refresh-token",
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            var serviceResult = Result<AuthResponse>.Success(authResponse);
            _mockAuthService.Setup(x => x.RegisterAsync(registerRequest))
                .ReturnsAsync(serviceResult);

            var result = await _authController.Register(registerRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<AuthResponse>>();

            var successResponse = okResult.Value as SuccessResponse<AuthResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.StatusCode.Should().Be(SuccessCodes.Created);
            successResponse.Message.Should().Be("Registration successful");
            successResponse.Data.Should().NotBeNull();

            _mockAuthService.Verify(x => x.RegisterAsync(registerRequest), Times.Once);
        }

        [Fact]
        public async Task Register_WithExistingEmail_ShouldReturnBadRequestWithErrorResponse()
        {
            var registerRequest = new RegisterRequest
            {
                Email = "existing@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!",
                FullName = "Existing User"
            };

            var errorResponse = ErrorResponse.FailureResult(
                "Email address is already registered",
                ErrorCodes.InvalidInput);

            var serviceResult = Result<AuthResponse>.Failure(errorResponse);
            _mockAuthService.Setup(x => x.RegisterAsync(registerRequest))
                .ReturnsAsync(serviceResult);

            var result = await _authController.Register(registerRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Email address is already registered");

            _mockAuthService.Verify(x => x.RegisterAsync(registerRequest), Times.Once);
        }

        [Fact]
        public async Task RefreshToken_WithValidToken_ShouldReturnOkWithSuccessResponse()
        {
            var refreshTokenRequest = new RefreshTokenRequest
            {
                RefreshToken = "valid-refresh-token"
            };

            var authResponse = new AuthResponse
            {
                AccessToken = "new-access-token",
                RefreshToken = "new-refresh-token",
                ExpiresAt = DateTime.UtcNow.AddHours(1)
            };

            var serviceResult = Result<AuthResponse>.Success(authResponse);
            _mockAuthService.Setup(x => x.RefreshTokenAsync(refreshTokenRequest.RefreshToken))
                .ReturnsAsync(serviceResult);

            var result = await _authController.RefreshToken(refreshTokenRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<AuthResponse>>();

            var successResponse = okResult.Value as SuccessResponse<AuthResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.Message.Should().Be("Token refreshed successfully");
            successResponse.Data.Should().NotBeNull();

            _mockAuthService.Verify(x => x.RefreshTokenAsync(refreshTokenRequest.RefreshToken), Times.Once);
        }

        [Fact]
        public async Task RefreshToken_WithInvalidToken_ShouldReturnBadRequestWithErrorResponse()
        {
            var refreshTokenRequest = new RefreshTokenRequest
            {
                RefreshToken = "invalid-refresh-token"
            };

            var errorResponse = ErrorResponse.FailureResult(
                "Invalid or expired refresh token",
                ErrorCodes.TokenInvalid);

            var serviceResult = Result<AuthResponse>.Failure(errorResponse);
            _mockAuthService.Setup(x => x.RefreshTokenAsync(refreshTokenRequest.RefreshToken))
                .ReturnsAsync(serviceResult);

            var result = await _authController.RefreshToken(refreshTokenRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Invalid or expired refresh token");

            _mockAuthService.Verify(x => x.RefreshTokenAsync(refreshTokenRequest.RefreshToken), Times.Once);
        }

        [Fact]
        public async Task RevokeToken_WithValidToken_ShouldReturnOkWithSuccessResponse()
        {
            var refreshTokenRequest = new RefreshTokenRequest
            {
                RefreshToken = "valid-refresh-token"
            };

            var serviceResult = Result.Success();
            _mockAuthService.Setup(x => x.RevokeRefreshTokenAsync(refreshTokenRequest.RefreshToken))
                .ReturnsAsync(serviceResult);

            var result = await _authController.RevokeToken(refreshTokenRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<object>>();

            var successResponse = okResult.Value as SuccessResponse<object>;
            successResponse!.Success.Should().BeTrue();
            successResponse.Message.Should().Be("Token revoked successfully");

            _mockAuthService.Verify(x => x.RevokeRefreshTokenAsync(refreshTokenRequest.RefreshToken), Times.Once);
        }

        [Fact]
        public async Task RevokeToken_WithInvalidToken_ShouldReturnBadRequestWithErrorResponse()
        {
            var refreshTokenRequest = new RefreshTokenRequest
            {
                RefreshToken = "invalid-refresh-token"
            };

            var errorResponse = ErrorResponse.FailureResult(
                "Invalid refresh token",
                ErrorCodes.TokenInvalid);

            var serviceResult = Result.Failure(errorResponse);
            _mockAuthService.Setup(x => x.RevokeRefreshTokenAsync(refreshTokenRequest.RefreshToken))
                .ReturnsAsync(serviceResult);

            var result = await _authController.RevokeToken(refreshTokenRequest);

            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Invalid refresh token");

            _mockAuthService.Verify(x => x.RevokeRefreshTokenAsync(refreshTokenRequest.RefreshToken), Times.Once);
        }

        [Fact]
        public void Constructor_ShouldInitializeWithAuthService()
        {
            var controller = new AuthController(_mockAuthService.Object);

            controller.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_WithNullAuthService_ShouldAcceptNull()
        {
            var controller = new AuthController(null!);
            controller.Should().NotBeNull();
        }
    }
}
