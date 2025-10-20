using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Mappings;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class UserServiceTests
    {
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly IUserService _userService;

        public UserServiceTests()
        {
            _mockMapper = new Mock<IMapper>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();
            var config = new MapperConfiguration(cfg => cfg.AddProfile<UserProfile>());
            _mockMapper.Setup(m => m.ConfigurationProvider).Returns(config);
            _mockMapper.Setup(m => m.ConfigurationProvider).Returns(config);
            _userService = new UserService(_mockUnitOfWork.Object, _mockMapper.Object, _mockCloudinaryService.Object);
        }

        #region GetUserByIdAsync Tests

        [Fact]
        public async Task UTCID01_GetUserByIdAsync_WithValidId_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true,
                DeletedAt = null,
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

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            _mockMapper.Setup(x => x.Map<UserDetailResponse>(user)).Returns(userDetailResponse);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Id.Should().Be(userId.ToString());
            result.Value.Email.Should().Be("test@example.com");
            result.Value.FullName.Should().Be("Test User");
            _mockMapper.Verify(x => x.Map<UserDetailResponse>(user), Times.Once);
        }

        // UTCID02: Empty GUID
        [Fact]
        public async Task UTCID02_GetUserByIdAsync_WithEmptyGuid_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        // UTCID03: Non-existent user
        [Fact]
        public async Task UTCID03_GetUserByIdAsync_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<User>()), Times.Never);
        }

        // UTCID04: Inactive user
        [Fact]
        public async Task UTCID04_GetUserByIdAsync_WithInactiveUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = false,
                DeletedAt = null
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<User>()), Times.Never);
        }

        // UTCID05: Deleted user
        [Fact]
        public async Task UTCID05_GetUserByIdAsync_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true,
                DeletedAt = DateTime.UtcNow
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);

            // Act
            var result = await _userService.GetUserByIdAsync(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockMapper.Verify(x => x.Map<UserDetailResponse>(It.IsAny<User>()), Times.Never);
        }
        #endregion

        #region UpdateUserAsync Tests

        [Fact]
        public async Task UTCID01_UpdateUserAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true,
                DeletedAt = null
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com",
                PhoneNumber = "+1234567890",
                ParticipationFrequency = ParticipationFrequency.Occasionally,
                BudgetOption = BudgetOption.Flexible,
                Address = "123 Main St",
                City = "Ho Chi Minh",
                IsEmailNotificationEnabled = true,
                IsPushNotificationEnabled = true,
                IsSmsNotificationEnabled = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.UserRepository.UpdateAsync(It.IsAny<User>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UTCID02_UpdateUserAsync_WithEmptyGuid_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task UTCID03_UpdateUserAsync_WithNullRequest_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");

            // Act
            var result = await _userService.UpdateUserAsync(userId, null!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task UTCID04_UpdateUserAsync_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task UTCID05_UpdateUserAsync_WithInactiveUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = false,
                DeletedAt = null
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task UTCID06_UpdateUserAsync_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true,
                DeletedAt = DateTime.UtcNow
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User account is inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task UTCID07_UpdateUserAsync_WithInvalidEmailFormat_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "invalid-email-format",
                PhoneNumber = "+1234567890"
            };

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid email format");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task UTCID08_UpdateUserAsync_WithInvalidPhoneNumber_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com",
                PhoneNumber = "invalid-phone"
            };

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Invalid phone number format");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task UTCID09_UpdateUserAsync_WithAvatarImage_ShouldReturnSuccess()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User { Id = userId, Email = "test@example.com", FullName = "Test User", IsActive = true };

            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns("avatar.jpg");
            mockFile.Setup(f => f.ContentType).Returns("image/jpeg");
            mockFile.Setup(f => f.Length).Returns(1024);
            mockFile.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[1024]));

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com",
                AvatarImg = mockFile.Object
            };

            var avatarUrl = "https://cloudinary.com/avatar.jpg";

            // All setups BEFORE Act
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            _mockCloudinaryService.Setup(x => x.UploadImageAsync(It.IsAny<IFormFile>())).ReturnsAsync(avatarUrl);
            _mockUnitOfWork.Setup(x => x.UserRepository.UpdateAsync(It.IsAny<User>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UTCID10_UpdateUserAsync_WithoutAvatarImage_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsActive = true,
                DeletedAt = null
            };

            var updateRequest = new UpdateUserRequest
            {
                FullName = "Updated User",
                Email = "updated@example.com",
                AvatarImg = null
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.UserRepository.UpdateAsync(It.IsAny<User>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _userService.UpdateUserAsync(userId, updateRequest);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(It.IsAny<IFormFile>()), Times.Never);
            _mockUnitOfWork.Verify(x => x.UserRepository.UpdateAsync(It.IsAny<User>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        #endregion

        #region GetAllUsersAsync Tests

        // UTCID01: Valid parameters, successful retrieval
        [Fact]
        public async Task UTCID01_GetAllUsersAsync_WithValidParameters_ShouldReturnSuccess()
        {
            // Arrange
            var users = new List<User>
            {
                new User { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Email = "user1@example.com", FullName = "User One", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-1) },
                new User { Id = Guid.Parse("22222222-2222-2222-2222-222222222333"), Email = "user2@example.com", FullName = "User Two", IsActive = true, CreatedAt = DateTime.UtcNow.AddDays(-2) }
            };

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value.TotalItems.Should().Be(2);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(10);
        }

        // UTCID02: First page with default parameters
        [Fact]
        public async Task UTCID02_GetAllUsersAsync_WithDefaultParameters_ShouldReturnFirstPage()
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
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(10); // Default page size
            result.Value.TotalItems.Should().Be(15);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(10);
        }

        // UTCID03: Second page with custom page size
        [Fact]
        public async Task UTCID03_GetAllUsersAsync_WithSecondPage_ShouldReturnCorrectPage()
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
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(2, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(5);
            result.Value.TotalItems.Should().Be(15);
            result.Value.CurrentPage.Should().Be(2);
            result.Value.PageSize.Should().Be(5);
        }

        // UTCID04: Last page with remaining items
        [Fact]
        public async Task UTCID04_GetAllUsersAsync_WithLastPage_ShouldReturnRemainingItems()
        {
            // Arrange
            var users = new List<User>();
            for (int i = 1; i <= 7; i++)
            {
                users.Add(new User
                {
                    Id = Guid.Parse($"22222222-2222-2222-2222-2222222222{i:00}"),
                    Email = $"user{i}@example.com",
                    FullName = $"User {i}",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(2, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2); // Only 2 items on last page
            result.Value.TotalItems.Should().Be(7);
            result.Value.CurrentPage.Should().Be(2);
            result.Value.PageSize.Should().Be(5);
        }

        // UTCID05: Empty result set
        [Fact]
        public async Task UTCID05_GetAllUsersAsync_WithNoUsers_ShouldReturnEmptyList()
        {
            // Arrange
            var users = new List<User>();
            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value.TotalItems.Should().Be(0);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(10);
        }

        // UTCID06: Boundary value - page number 1
        [Fact]
        public async Task UTCID06_GetAllUsersAsync_WithPageNumberOne_ShouldReturnFirstPage()
        {
            // Arrange
            var users = new List<User>();
            for (int i = 1; i <= 5; i++)
            {
                users.Add(new User
                {
                    Id = Guid.Parse($"22222222-2222-2222-2222-2222222222{i:00}"),
                    Email = $"user{i}@example.com",
                    FullName = $"User {i}",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 3);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(3);
            result.Value.TotalItems.Should().Be(5);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(3);
        }

        // UTCID07: Boundary value - minimum page size
        [Fact]
        public async Task UTCID07_GetAllUsersAsync_WithMinimumPageSize_ShouldReturnSuccess()
        {
            // Arrange
            var users = new List<User>();
            for (int i = 1; i <= 3; i++)
            {
                users.Add(new User
                {
                    Id = Guid.Parse($"22222222-2222-2222-2222-2222222222{i:00}"),
                    Email = $"user{i}@example.com",
                    FullName = $"User {i}",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 1);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.TotalItems.Should().Be(3);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(1);
        }

        // UTCID08: Boundary value - large page size
        [Fact]
        public async Task UTCID08_GetAllUsersAsync_WithLargePageSize_ShouldReturnAllItems()
        {
            // Arrange
            var users = new List<User>();
            for (int i = 1; i <= 5; i++)
            {
                users.Add(new User
                {
                    Id = Guid.Parse($"22222222-2222-2222-2222-2222222222{i:00}"),
                    Email = $"user{i}@example.com",
                    FullName = $"User {i}",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 100);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(5);
            result.Value.TotalItems.Should().Be(5);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(100);
        }

        // UTCID09: Page number beyond available data
        [Fact]
        public async Task UTCID09_GetAllUsersAsync_WithPageBeyondData_ShouldReturnEmptyPage()
        {
            // Arrange
            var users = new List<User>();
            for (int i = 1; i <= 5; i++)
            {
                users.Add(new User
                {
                    Id = Guid.Parse($"22222222-2222-2222-2222-2222222222{i:00}"),
                    Email = $"user{i}@example.com",
                    FullName = $"User {i}",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-i)
                });
            }

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(10, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value.TotalItems.Should().Be(5);
            result.Value.CurrentPage.Should().Be(10);
            result.Value.PageSize.Should().Be(5);
        }

        // UTCID10: Users with different creation dates (ordering test)
        [Fact]
        public async Task UTCID10_GetAllUsersAsync_WithDifferentCreationDates_ShouldReturnOrderedResults()
        {
            // Arrange
            var users = new List<User>
            {
                new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222001"),
                    Email = "user1@example.com",
                    FullName = "User One",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222002"),
                    Email = "user2@example.com",
                    FullName = "User Two",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                },
                new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222003"),
                    Email = "user3@example.com",
                    FullName = "User Three",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                }
            };

            var mockDbSet = users.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(mockDbSet.Object);

            // Act
            var result = await _userService.GetAllUsersAsync(1, 10);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(3);
            result.Value.TotalItems.Should().Be(3);
        }

        #endregion
    }
}
