using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Domain.Identity;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using Xunit;

namespace AIEvent.Application.Test.Services
{
    public class UserServiceTests
    {
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<IMapper> _mockMapper;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            var userStore = new Mock<IUserStore<AppUser>>();
            _mockUserManager = new Mock<UserManager<AppUser>>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);
            _mockMapper = new Mock<IMapper>();

            _userService = new UserService(_mockUserManager.Object, _mockMapper.Object);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithInvalidId_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.NewGuid().ToString();

            _mockUserManager.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((AppUser?)null);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
        }

        [Fact]
        public async Task UpdateUserAsync_WithInvalidUserId_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.NewGuid().ToString();
            var request = new UpdateUserRequest
            {
                FullName = "Updated User"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(userId))
                .ReturnsAsync((AppUser?)null);

            // Act
            var result = await _userService.UpdateUserAsync(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
        }
    }
}
