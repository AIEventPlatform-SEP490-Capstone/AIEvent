using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class UserServiceTests
    {
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            var userStore = new Mock<IUserStore<AppUser>>();
            _mockUserManager = new Mock<UserManager<AppUser>>(
                userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);
            _mockMapper = new Mock<IMapper>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();
            _userService = new UserService(_mockUserManager.Object, _mockMapper.Object, _mockCloudinaryService.Object);
        }

        #region GetUserByIdAsync Tests

        [Fact]
        public async Task GetUserByIdAsync_WithValidId_ShouldReturnSuccessResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new AppUser
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true,
                UserInterests = new List<UserInterest>
                {
                    new UserInterest
                    {
                        InterestId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                        UserId = userId,
                        Interest = new Interest {
                            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                            Name = "Technology"
                        }
                    }
                }
            };

            var userDetailResponse = new UserDetailResponse
            {
                Id = userId.ToString(),
                Email = user.Email,
                FullName = user.FullName,
                UserInterests = new List<UserInterestResponse>
                {
                    new UserInterestResponse { InterestId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), InterestName = "Technology" }
                }
            };

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);
            _mockMapper.Setup(x => x.Map<UserDetailResponse>(user)).Returns(userDetailResponse);

            // Act
            var result = await _userService.GetUserByIdAsync(userId.ToString());

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
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString();
            var users = new List<AppUser>().AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<AppUser>()), Times.Never);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithInactiveUser_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new AppUser
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = false
            };

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);

            // Act
            var result = await _userService.GetUserByIdAsync(userId.ToString());

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<AppUser>()), Times.Never);
        }

        #endregion

        #region UpdateUserAsync Tests

        [Fact]
        public async Task UpdateUserAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString();
            var user = new AppUser
            {
                Id = Guid.Parse(userId),
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
                Id = userId,
                Email = updateRequest.Email,
                FullName = updateRequest.FullName,
                PhoneNumber = updateRequest.PhoneNumber
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);
            _mockMapper.Setup(x => x.Map(updateRequest, user));
            _mockUserManager.Setup(x => x.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);
            _mockMapper.Setup(x => x.Map<UserDetailResponse>(user)).Returns(updatedUserResponse);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.FullName.Should().Be("Updated User");
            result.Value.Email.Should().Be("updated@example.com");

            _mockUserManager.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockMapper.Verify(x => x.Map(updateRequest, user), Times.Once);
            _mockUserManager.Verify(x => x.UpdateAsync(user), Times.Once);
            _mockMapper.Verify(x => x.Map<UserDetailResponse>(user), Times.Once);
        }

        [Fact]
        public async Task UpdateUserAsync_WithNonExistentUser_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString();
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync((AppUser?)null);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            _mockUserManager.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockMapper.Verify(x => x.Map(It.IsAny<UpdateUserRequest>(), It.IsAny<AppUser>()), Times.Never);
            _mockUserManager.Verify(x => x.UpdateAsync(It.IsAny<AppUser>()), Times.Never);
        }

        [Fact]
        public async Task UpdateUserAsync_WithInactiveUser_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString();
            var user = new AppUser
            {
                Id = Guid.Parse(userId),
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = false
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            _mockUserManager.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockMapper.Verify(x => x.Map(It.IsAny<UpdateUserRequest>(), It.IsAny<AppUser>()), Times.Never);
            _mockUserManager.Verify(x => x.UpdateAsync(It.IsAny<AppUser>()), Times.Never);
        }

        [Fact]
        public async Task UpdateUserAsync_WithUpdateFailure_ShouldReturnFailureResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222").ToString();
            var user = new AppUser
            {
                Id = Guid.Parse(userId),
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updatedexample.com"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(userId)).ReturnsAsync(user);
            _mockMapper.Setup(x => x.Map(updateRequest, user));
            _mockUserManager.Setup(x => x.UpdateAsync(user)).ReturnsAsync(IdentityResult.Failed());

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to update user");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockUserManager.Verify(x => x.FindByIdAsync(userId), Times.Once);
            _mockMapper.Verify(x => x.Map(updateRequest, user), Times.Once);
            _mockUserManager.Verify(x => x.UpdateAsync(user), Times.Once);
            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<AppUser>()), Times.Never);
        }

        #endregion

        #region GetAllUsersAsync Tests

        [Fact]
        public async Task GetAllUsersAsync_WithValidParameters_ShouldReturnSuccessResult()
        {
            // Arrange
            var users = new List<AppUser>
            {
                new AppUser
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Email = "user1@example.com",
                    FullName = "User One",
                    IsActive = true
                },
                new AppUser
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
            _mockUserManager.Setup(x => x.Users).Returns(mockDbSet.Object);
            _mockMapper.Setup(x => x.Map<UserResponse>(users[0])).Returns(userResponses[0]);
            _mockMapper.Setup(x => x.Map<UserResponse>(users[1])).Returns(userResponses[1]);
            _mockUserManager.Setup(x => x.GetRolesAsync(users[0])).ReturnsAsync(new List<string> { "User" });
            _mockUserManager.Setup(x => x.GetRolesAsync(users[1])).ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Count.Should().Be(2);
            result.Value[0].Email.Should().Be("user1@example.com");
            result.Value[1].Email.Should().Be("user2@example.com");

            _mockMapper.Verify(x => x.Map<UserResponse>(It.IsAny<AppUser>()), Times.Exactly(2));
            _mockUserManager.Verify(x => x.GetRolesAsync(It.IsAny<AppUser>()), Times.Exactly(2));
        }

        [Fact]
        public async Task GetAllUsersAsync_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange
            var users = new List<AppUser>();
            for (int i = 1; i <= 15; i++)
            {
                users.Add(new AppUser
                {
                    Id = Guid.Parse($"22222222-2222-2222-2222-2222222222{i:00}"),
                    Email = $"user{i}@example.com",
                    FullName = $"User {i}",
                    IsActive = true
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(mockDbSet.Object);

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
                _mockUserManager.Setup(x => x.GetRolesAsync(users[i])).ReturnsAsync(new List<string> { "User" });
            }

            // Act
            var result = await _userService.GetAllUsersAsync(2, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Count.Should().Be(5);
            result.Value[0].Email.Should().Be("user6@example.com");
            result.Value[4].Email.Should().Be("user10@example.com");
        }

        [Fact]
        public async Task GetAllUsersAsync_WithInactiveUsers_ShouldReturnOnlyActiveUsers()
        {
            // Arrange
            var users = new List<AppUser>
            {
                new AppUser
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    Email = "active@example.com",
                    FullName = "Active User",
                    IsActive = true
                },
                new AppUser
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
            _mockUserManager.Setup(x => x.Users).Returns(mockDbSet.Object);
            _mockMapper.Setup(x => x.Map<UserResponse>(users[0])).Returns(activeUserResponse);
            _mockUserManager.Setup(x => x.GetRolesAsync(users[0])).ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Count.Should().Be(1);
            result.Value[0].Email.Should().Be("active@example.com");

            _mockMapper.Verify(x => x.Map<UserResponse>(users[0]), Times.Once);
            _mockMapper.Verify(x => x.Map<UserResponse>(users[1]), Times.Never);
            _mockUserManager.Verify(x => x.GetRolesAsync(users[0]), Times.Once);
        }

        [Fact]
        public async Task GetAllUsersAsync_WithNoUsers_ShouldReturnEmptyList()
        {
            // Arrange
            var users = new List<AppUser>();
            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Count.Should().Be(0);

            _mockMapper.Verify(x => x.Map<UserResponse>(It.IsAny<AppUser>()), Times.Never);
            _mockUserManager.Verify(x => x.GetRolesAsync(It.IsAny<AppUser>()), Times.Never);
        }

        #endregion
    }
}
