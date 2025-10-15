using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class UserServiceTests
    {
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _mockMapper = new Mock<IMapper>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();
            _userService = new UserService(_mockUnitOfWork.Object, _mockMapper.Object, _mockCloudinaryService.Object);
        }

        #region GetUserByIdAsync Tests

        [Fact]
        public async Task GetUserByIdAsync_WithValidId_ShouldReturnSuccessResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true,
                UserInterestsJson = new List<UserInterest>
                {
                    new UserInterest { InterestName = "Technology" }
                }.ToString()
            };

            var userDetailResponse = new UserDetailResponse
            {
                Id = userId.ToString(),
                Email = user.Email,
                FullName = user.FullName,
                UserInterests = new List<UserInterest>
                {
                    new UserInterest { InterestName = "Technology" }
                }
            };

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);
            _mockMapper.Setup(x => x.Map<UserDetailResponse>(user)).Returns(userDetailResponse);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Id.Should().Be(userId.ToString());
            result.Value.Email.Should().Be("test@example.com");
            result.Value.FullName.Should().Be("Test User");

            _mockMapper.Verify(x => x.Map<UserDetailResponse>(user), Times.Once);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithNonExistentId_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var users = new List<User>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithInactiveUser_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = false
            };

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<User>()), Times.Never);
        }

        #endregion

        #region UpdateUserAsync Tests

        [Fact]
        public async Task UpdateUserAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com",
                PhoneNumber = "0123456789"
            };

            var updatedUserResponse = new UserDetailResponse
            {
                Id = userId.ToString(),
                Email = updateRequest.Email,
                FullName = updateRequest.FullName,
                PhoneNumber = updateRequest.PhoneNumber
            };

            _mockMapper.Setup(x => x.Map(updateRequest, user));
            _mockMapper.Setup(x => x.Map<UserDetailResponse>(user)).Returns(updatedUserResponse);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
                
        }

        [Fact]
        public async Task UpdateUserAsync_WithNonExistentUser_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };
            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UpdateUserAsync_WithInactiveUser_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = false
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        [Fact]
        public async Task UpdateUserAsync_WithUpdateFailure_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updatedexample.com"
            };

            _mockMapper.Setup(x => x.Map(updateRequest, user));

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to update user");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

        }

        #endregion

        #region GetAllUsersAsync Tests

        [Fact]
        public async Task GetAllUsersAsync_WithValidParameters_ShouldReturnSuccessResult()
        {
            // Arrange
            var users = new List<User>
            {
                new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Email = "user1@example.com",
                    FullName = "User One",
                    IsActive = true
                },
                new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222333"),
                    Email = "user2@example.com",
                    FullName = "User Two",
                    IsActive = true
                }
            };

            var userResponses = new List<UserResponse>
            {
                new UserResponse
                {
                    Id = users[0].Id.ToString(),
                    Email = users[0].Email!,
                    FullName = users[0].FullName!,
                    Roles = new List<string> { "User" }
                },
                new UserResponse
                {
                    Id = users[1].Id.ToString(),
                    Email = users[1].Email!,
                    FullName = users[1].FullName!,
                    Roles = new List<string> { "User" }
                }
            };

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);
            _mockMapper.Setup(x => x.Map<UserResponse>(users[0])).Returns(userResponses[0]);
            _mockMapper.Setup(x => x.Map<UserResponse>(users[1])).Returns(userResponses[1]);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task GetAllUsersAsync_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange
            var users = new List<User>();
            for (int i = 1; i <= 15; i++)
            {
                users.Add(new User
                {
                    Id = Guid.Parse($"22222222-2222-2222-2222-2222222222{i:00}"),
                    Email = $"user{i}@example.com",
                    FullName = $"User {i}",
                    IsActive = true
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();

            // Setup mapper for each user that will be returned (page 2, pageSize 5 = users 6-10)
            for (int i = 5; i < 10; i++)
            {
                var userResponse = new UserResponse
                {
                    Id = users[i].Id.ToString(),
                    Email = users[i].Email!,
                    FullName = users[i].FullName!,
                    Roles = new List<string> { "User" }
                };
                _mockMapper.Setup(x => x.Map<UserResponse>(users[i])).Returns(userResponse);
            }

            // Act
            var result = await _userService.GetAllUsersAsync(2, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task GetAllUsersAsync_WithInactiveUsers_ShouldReturnOnlyActiveUsers()
        {
            // Arrange
            var users = new List<User>
            {
                new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Email = "active@example.com",
                    FullName = "Active User",
                    IsActive = true
                },
                new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222333"),
                    Email = "inactive@example.com",
                    FullName = "Inactive User",
                    IsActive = false
                }
            };

            var activeUserResponse = new UserResponse
            {
                Id = users[0].Id.ToString(),
                Email = users[0].Email!,
                FullName = users[0].FullName!,
                Roles = new List<string> { "User" }
            };

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockMapper.Setup(x => x.Map<UserResponse>(users[0])).Returns(activeUserResponse);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
        }

        [Fact]
        public async Task GetAllUsersAsync_WithNoUsers_ShouldReturnEmptyList()
        {
            // Arrange
            var users = new List<User>();
            var mockDbSet = users.AsQueryable().BuildMockDbSet();

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
        }

        #endregion
    }
}
