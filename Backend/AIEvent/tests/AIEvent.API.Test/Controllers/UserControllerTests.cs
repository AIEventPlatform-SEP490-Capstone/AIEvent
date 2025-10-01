using AIEvent.API.Controllers;
using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace AIEvent.API.Test.Controllers
{
    public class UserControllerTests
    {
        private readonly Mock<IUserService> _mockUserService;
        private readonly UserController _userController;
        private readonly Guid _testUserId = Guid.NewGuid();

        public UserControllerTests()
        {
            _mockUserService = new Mock<IUserService>();
            _userController = new UserController(_mockUserService.Object);
            
            // Setup HttpContext with user claims for authenticated requests
            SetupHttpContext();
        }

        private void SetupHttpContext()
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
                new Claim(ClaimTypes.Email, "test@example.com"),
                new Claim(ClaimTypes.Role, "User")
            };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            var httpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            };

            _userController.ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            };
        }

        [Fact]
        public async Task GetUser_WithValidId_ShouldReturnOkWithUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var userResponse = new UserResponse
            {
                Id = userId.ToString(),
                Email = "test@example.com",
                FullName = "Test User",
                Roles = new List<string> { "User" },
                CreatedAt = DateTime.UtcNow
            };

            var serviceResult = Result<UserResponse>.Success(userResponse);
            _mockUserService.Setup(x => x.GetUserByIdAsync(userId.ToString()))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _userController.GetUser(userId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<UserResponse>>();

            var successResponse = okResult.Value as SuccessResponse<UserResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.Id.Should().Be(userId.ToString());
            successResponse.Message.Should().Be("User retrieved successfully");

            _mockUserService.Verify(x => x.GetUserByIdAsync(userId.ToString()), Times.Once);
        }

        [Fact]
        public async Task GetUser_WhenUserNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var errorResponse = ErrorResponse.FailureResult("User not found", ErrorCodes.NotFound);
            var serviceResult = Result<UserResponse>.Failure(errorResponse);
            _mockUserService.Setup(x => x.GetUserByIdAsync(userId.ToString()))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _userController.GetUser(userId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<NotFoundObjectResult>();

            var notFoundResult = result.Result as NotFoundObjectResult;
            notFoundResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = notFoundResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("User not found");

            _mockUserService.Verify(x => x.GetUserByIdAsync(userId.ToString()), Times.Once);
        }

        [Fact]
        public async Task GetProfile_WhenSuccessful_ShouldReturnOkWithProfile()
        {
            // Arrange
            var userResponse = new UserResponse
            {
                Id = _testUserId.ToString(),
                Email = "test@example.com",
                FullName = "Test User",
                Roles = new List<string> { "User" },
                CreatedAt = DateTime.UtcNow
            };

            var serviceResult = Result<UserResponse>.Success(userResponse);
            _mockUserService.Setup(x => x.GetUserByIdAsync(_testUserId.ToString()))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _userController.GetProfile();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<UserResponse>>();

            var successResponse = okResult.Value as SuccessResponse<UserResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.Id.Should().Be(_testUserId.ToString());
            successResponse.Message.Should().Be("Profile retrieved successfully");

            _mockUserService.Verify(x => x.GetUserByIdAsync(_testUserId.ToString()), Times.Once);
        }

        [Fact]
        public async Task UpdateProfile_WithValidRequest_ShouldReturnOkWithUpdatedProfile()
        {
            // Arrange
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated Name",
                PhoneNumber = "0987654321"
            };

            var updatedUserResponse = new UserResponse
            {
                Id = _testUserId.ToString(),
                Email = "test@example.com",
                FullName = "Updated Name",
                PhoneNumber = "0987654321",
                Roles = new List<string> { "User" },
                CreatedAt = DateTime.UtcNow
            };

            var serviceResult = Result<UserResponse>.Success(updatedUserResponse);
            _mockUserService.Setup(x => x.UpdateUserAsync(_testUserId.ToString(), updateRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _userController.UpdateProfile(updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<UserResponse>>();

            var successResponse = okResult.Value as SuccessResponse<UserResponse>;
            successResponse!.Success.Should().BeTrue();
            successResponse.StatusCode.Should().Be(SuccessCodes.Updated);
            successResponse.Message.Should().Be("Profile updated successfully");
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.FullName.Should().Be("Updated Name");

            _mockUserService.Verify(x => x.UpdateUserAsync(_testUserId.ToString(), updateRequest), Times.Once);
        }

        [Fact]
        public async Task UpdateProfile_WhenServiceFails_ShouldReturnBadRequest()
        {
            // Arrange
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated Name"
            };

            var errorResponse = ErrorResponse.FailureResult("Failed to update user", ErrorCodes.InvalidInput);
            var serviceResult = Result<UserResponse>.Failure(errorResponse);
            _mockUserService.Setup(x => x.UpdateUserAsync(_testUserId.ToString(), updateRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _userController.UpdateProfile(updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Failed to update user");

            _mockUserService.Verify(x => x.UpdateUserAsync(_testUserId.ToString(), updateRequest), Times.Once);
        }

        [Fact]
        public async Task GetAllUsers_WithValidParameters_ShouldReturnOkWithUsers()
        {
            // Arrange
            var users = new List<UserResponse>
            {
                new UserResponse { Id = Guid.NewGuid().ToString(), Email = "user1@example.com", FullName = "User 1" },
                new UserResponse { Id = Guid.NewGuid().ToString(), Email = "user2@example.com", FullName = "User 2" }
            };

            var serviceResult = Result<List<UserResponse>>.Success(users);
            _mockUserService.Setup(x => x.GetAllUsersAsync(1, 10))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _userController.GetAllUsers(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<List<UserResponse>>>();

            var successResponse = okResult.Value as SuccessResponse<List<UserResponse>>;
            successResponse!.Success.Should().BeTrue();
            successResponse.Data.Should().NotBeNull();
            successResponse.Data!.Should().HaveCount(2);
            successResponse.Message.Should().Be("Users retrieved successfully");

            _mockUserService.Verify(x => x.GetAllUsersAsync(1, 10), Times.Once);
        }

        [Fact]
        public async Task GetAllUsers_WhenServiceFails_ShouldReturnBadRequest()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Failed to retrieve users", ErrorCodes.InternalServerError);
            var serviceResult = Result<List<UserResponse>>.Failure(errorResponse);
            _mockUserService.Setup(x => x.GetAllUsersAsync(1, 10))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _userController.GetAllUsers(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Success.Should().BeFalse();
            errorResponseResult.Message.Should().Be("Failed to retrieve users");

            _mockUserService.Verify(x => x.GetAllUsersAsync(1, 10), Times.Once);
        }

        [Fact]
        public void Constructor_ShouldInitializeWithUserService()
        {
            // Act & Assert
            var controller = new UserController(_mockUserService.Object);
            controller.Should().NotBeNull();
        }
    }
}
