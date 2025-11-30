using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Hubs;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class NotificationServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork; 
        private readonly Mock<IHubContext<NotificationHub>> _mockHubContext;
        private readonly Mock<IClientProxy> _mockClientProxy;
        private readonly INotificationService _notificationService;
        private readonly Mock<IEmailService> _mockEmailService;

        private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid UserId2 = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid NotificationId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        private static readonly Guid EventId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        private static readonly Guid RoleId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        public NotificationServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockHubContext = new Mock<IHubContext<NotificationHub>>();
            _mockClientProxy = new Mock<IClientProxy>();
            _mockEmailService = new Mock<IEmailService>(); 
            // Setup SendCoreAsync for extension method SendAsync
            _mockClientProxy.Setup(x => x.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var mockClients = new Mock<IHubClients>();
            mockClients.Setup(x => x.User(It.IsAny<string>())).Returns(_mockClientProxy.Object);
            _mockHubContext.Setup(x => x.Clients).Returns(mockClients.Object);

            _notificationService = new NotificationService(_mockUnitOfWork.Object, _mockHubContext.Object, _mockEmailService.Object);
        }

        #region CreateNotificationAsync Tests

        // UTCID01: Valid request with all required fields - Success
        [Fact]
        public async Task UTCID01_CreateNotificationAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateNotificationRequest
            {
                UserId = UserId,
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.System,
                
            };

            var notification = new Notification
            {
                Id = NotificationId,
                UserId = UserId,
                Title = request.Title,
                Message = request.Message,
                Type = request.Type, 
                IsRead = false
            };

            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddAsync(It.IsAny<Notification>()))
                .ReturnsAsync((Notification n) => n);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddAsync(It.IsAny<Notification>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        // UTCID02: Valid request with optional fields (ImageUrl, EventId) - Success
        [Fact]
        public async Task UTCID02_CreateNotificationAsync_WithOptionalFields_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateNotificationRequest
            {
                UserId = UserId,
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.EventApproved, 
                ImageUrl = "https://example.com/image.jpg",
                EventId = EventId
            };

            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddAsync(It.IsAny<Notification>()))
                .ReturnsAsync((Notification n) => n);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddAsync(It.Is<Notification>(n =>
                n.ImageUrl == request.ImageUrl && n.EventId == request.EventId)), Times.Once);
        }

        // UTCID03: Empty title - Failure
        [Fact]
        public async Task UTCID03_CreateNotificationAsync_WithEmptyTitle_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateNotificationRequest
            {
                UserId = UserId,
                Title = "",
                Message = "Test message",
                Type = NotificationType.System,
                
            };

            // Act
            var result = await _notificationService.CreateNotificationAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Title is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddAsync(It.IsAny<Notification>()), Times.Never);
        }

        // UTCID04: Null title - Failure
        [Fact]
        public async Task UTCID04_CreateNotificationAsync_WithNullTitle_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateNotificationRequest
            {
                UserId = UserId,
                Title = null!,
                Message = "Test message",
                Type = NotificationType.System,
                
            };

            // Act
            var result = await _notificationService.CreateNotificationAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Title is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID05: Empty message - Failure
        [Fact]
        public async Task UTCID05_CreateNotificationAsync_WithEmptyMessage_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateNotificationRequest
            {
                UserId = UserId,
                Title = "Test Notification",
                Message = "",
                Type = NotificationType.System,
                
            };

            // Act
            var result = await _notificationService.CreateNotificationAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Message is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }


        // UTCID06: Null message - Failure
        [Fact]
        public async Task UTCID06_CreateNotificationAsync_WithNullMessage_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateNotificationRequest
            {
                UserId = UserId,
                Title = "Test Notification",
                Message = null!,
                Type = NotificationType.System,
                
            };

            // Act
            var result = await _notificationService.CreateNotificationAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Message is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID07: All notification types - Success
        [Theory]
        [InlineData(NotificationType.OrganizerRegistrationPending)]
        [InlineData(NotificationType.OrganizerApproved)]
        [InlineData(NotificationType.OrganizerRejected)]
        [InlineData(NotificationType.EventCreated)]
        [InlineData(NotificationType.EventApproved)]
        [InlineData(NotificationType.EventRejected)] 
        [InlineData(NotificationType.EventInvitation)]
        [InlineData(NotificationType.EventInvitationAccepted)]
        [InlineData(NotificationType.EventInvitationRejected)] 
        [InlineData(NotificationType.Refund)]
        [InlineData(NotificationType.System)]
        public async Task UTCID07_CreateNotificationAsync_WithAllNotificationTypes_ShouldReturnSuccess(NotificationType type)
        {
            // Arrange
            var request = new CreateNotificationRequest
            {
                UserId = UserId,
                Title = "Test Notification",
                Message = "Test message",
                Type = type,
                
            };

            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddAsync(It.IsAny<Notification>()))
                .ReturnsAsync((Notification n) => n);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        #endregion

        #region CreateNotificationToAllAsync Tests

        // UTCID01: Valid request with target roles - Success
        [Fact]
        public async Task UTCID01_CreateNotificationToAllAsync_WithTargetRoles_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateNotificationToAllRequest
            {
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.System, 
                TargetRoles = new List<Guid> { RoleId }
            };

            var users = new List<User>
            {
                new User { Id = UserId, RoleId = RoleId, IsDeleted = false },
                new User { Id = UserId2, RoleId = RoleId, IsDeleted = false }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddRangeAsync(It.IsAny<List<Notification>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddRangeAsync(It.Is<List<Notification>>(n => n.Count == 2)), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        // UTCID02: Valid request without target roles (all users) - Success
        [Fact]
        public async Task UTCID02_CreateNotificationToAllAsync_WithoutTargetRoles_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateNotificationToAllRequest
            {
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.System, 
                TargetRoles = null
            };

            var users = new List<User>
            {
                new User { Id = UserId, IsDeleted = false },
                new User { Id = UserId2, IsDeleted = false }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddRangeAsync(It.IsAny<List<Notification>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddRangeAsync(It.Is<List<Notification>>(n => n.Count == 2)), Times.Once);
        }

        // UTCID03: No target users found - Failure
        [Fact]
        public async Task UTCID03_CreateNotificationToAllAsync_WithNoTargetUsers_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateNotificationToAllRequest
            {
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.System, 
                TargetRoles = new List<Guid> { RoleId }
            };

            var users = new List<User>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddRangeAsync(It.IsAny<List<Notification>>()), Times.Never);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
        }

        // UTCID04: Empty title - Failure
        [Fact]
        public async Task UTCID04_CreateNotificationToAllAsync_WithEmptyTitle_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateNotificationToAllRequest
            {
                Title = "",
                Message = "Test message",
                Type = NotificationType.System,
                
            };

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Title is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }


        // UTCID05: Empty message - Failure
        [Fact]
        public async Task UTCID05_CreateNotificationToAllAsync_WithEmptyMessage_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateNotificationToAllRequest
            {
                Title = "Test Notification",
                Message = "",
                Type = NotificationType.System,
                
            };

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Message is required");
        }

        // UTCID06: Users with deleted flag filtered out - Success
        [Fact]
        public async Task UTCID06_CreateNotificationToAllAsync_WithDeletedUsers_ShouldFilterDeletedUsers()
        {
            // Arrange
            var request = new CreateNotificationToAllRequest
            {
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.System, 
                TargetRoles = new List<Guid> { RoleId }
            };

            var users = new List<User>
            {
                new User { Id = UserId, RoleId = RoleId, IsDeleted = false },
                new User { Id = UserId2, RoleId = RoleId, IsDeleted = true } // Should be filtered
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddRangeAsync(It.IsAny<List<Notification>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddRangeAsync(It.Is<List<Notification>>(n => n.Count == 1)), Times.Once);
        }

        // UTCID07: Multiple target roles - Success
        [Fact]
        public async Task UTCID07_CreateNotificationToAllAsync_WithMultipleTargetRoles_ShouldReturnSuccess()
        {
            // Arrange
            var roleId2 = Guid.NewGuid();
            var request = new CreateNotificationToAllRequest
            {
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.System, 
                TargetRoles = new List<Guid> { RoleId, roleId2 }
            };

            var users = new List<User>
            {
                new User { Id = UserId, RoleId = RoleId, IsDeleted = false },
                new User { Id = UserId2, RoleId = roleId2, IsDeleted = false }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddRangeAsync(It.IsAny<List<Notification>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddRangeAsync(It.Is<List<Notification>>(n => n.Count == 2)), Times.Once);
        }

        // UTCID08: Request with optional fields (ImageUrl, EventId) - Success
        [Fact]
        public async Task UTCID08_CreateNotificationToAllAsync_WithOptionalFields_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateNotificationToAllRequest
            {
                Title = "Test Notification",
                Message = "Test message",
                Type = NotificationType.EventApproved, 
                TargetRoles = new List<Guid> { RoleId },
                ImageUrl = "https://example.com/image.jpg",
                EventId = EventId
            };

            var users = new List<User>
            {
                new User { Id = UserId, RoleId = RoleId, IsDeleted = false }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddRangeAsync(It.IsAny<List<Notification>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.AddRangeAsync(It.Is<List<Notification>>(n => 
                n.All(notif => notif.ImageUrl == request.ImageUrl && notif.EventId == request.EventId))), Times.Once);
        }

        #endregion

        #region GetNotificationsByUserIdAsync Tests

        // UTCID01: Valid request with notifications - Success
        [Fact]
        public async Task UTCID01_GetNotificationsByUserIdAsync_WithNotifications_ShouldReturnSuccess()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification
                {
                    Id = NotificationId,
                    UserId = UserId,
                    Title = "Test Notification",
                    Message = "Test message",
                    Type = NotificationType.System,
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.GetNotificationsByUserIdAsync(UserId, null, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(1);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.TotalPages.Should().Be(1);
        }

        // UTCID02: Pagination - Page 1 with 10 items - Success
        [Fact]
        public async Task UTCID02_GetNotificationsByUserIdAsync_WithPaginationPage1_ShouldReturnCorrectPage()
        {
            // Arrange
            var notifications = new List<Notification>();
            for (int i = 0; i < 25; i++)
            {
                notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    Title = $"Notification {i}",
                    Message = "Test message",
                    Type = NotificationType.System,
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-i)
                });
            }

            var notificationsQuery = notifications.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notificationsQuery.Object);

            // Act
            var result = await _notificationService.GetNotificationsByUserIdAsync(UserId, null, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(10);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.TotalPages.Should().Be(3);
            result.Value!.TotalItems.Should().Be(25);
        }

        // UTCID03: Pagination - Page 2 with 10 items - Success
        [Fact]
        public async Task UTCID03_GetNotificationsByUserIdAsync_WithPaginationPage2_ShouldReturnCorrectPage()
        {
            // Arrange
            var notifications = new List<Notification>();
            for (int i = 0; i < 25; i++)
            {
                notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    Title = $"Notification {i}",
                    Message = "Test message",
                    Type = NotificationType.System,
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-i)
                });
            }

            var notificationsQuery = notifications.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notificationsQuery.Object);

            // Act
            var result = await _notificationService.GetNotificationsByUserIdAsync(UserId, null, 2, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(10);
            result.Value!.CurrentPage.Should().Be(2);
            result.Value!.TotalPages.Should().Be(3);
        }

        // UTCID04: Pagination - Last page with remaining items - Success
        [Fact]
        public async Task UTCID04_GetNotificationsByUserIdAsync_WithPaginationLastPage_ShouldReturnRemainingItems()
        {
            // Arrange
            var notifications = new List<Notification>();
            for (int i = 0; i < 25; i++)
            {
                notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = UserId,
                    Title = $"Notification {i}",
                    Message = "Test message",
                    Type = NotificationType.System,
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-i)
                });
            }

            var notificationsQuery = notifications.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notificationsQuery.Object);

            // Act
            var result = await _notificationService.GetNotificationsByUserIdAsync(UserId, null, 3, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(5);
            result.Value!.CurrentPage.Should().Be(3);
            result.Value!.TotalPages.Should().Be(3);
        }

        // UTCID05: No notifications for user - Success (empty list)
        [Fact]
        public async Task UTCID05_GetNotificationsByUserIdAsync_WithNoNotifications_ShouldReturnEmptyList()
        {
            // Arrange
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.GetNotificationsByUserIdAsync(UserId, null, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
            result.Value!.TotalPages.Should().Be(0);
        }

        // UTCID06: Deleted notifications filtered out - Success
        [Fact]
        public async Task UTCID06_GetNotificationsByUserIdAsync_WithDeletedNotifications_ShouldFilterDeleted()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = NotificationId, UserId = UserId, Title = "Active", Message = "Test", Type = NotificationType.System, IsDeleted = false },
                new Notification { Id = Guid.NewGuid(), UserId = UserId, Title = "Deleted", Message = "Test", Type = NotificationType.System, IsDeleted = true }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.GetNotificationsByUserIdAsync(UserId, null, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().Title.Should().Be("Active");
        }

        #endregion

        #region MarkAsReadAsync Tests

        // UTCID01: Valid unread notification - Success
        [Fact]
        public async Task UTCID01_MarkAsReadAsync_WithUnreadNotification_ShouldReturnSuccess()
        {
            // Arrange
            var notification = new Notification
            {
                Id = NotificationId,
                UserId = UserId,
                Title = "Test Notification",
                Message = "Test message",
                IsRead = false
            };

            var notifications = new List<Notification> { notification }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.UpdateAsync(It.IsAny<Notification>()))
                .ReturnsAsync((Notification n) => n);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.MarkAsReadAsync(NotificationId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.UpdateAsync(It.Is<Notification>(n =>
                n.Id == NotificationId && n.IsRead == true && n.ReadAt.HasValue)), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        // UTCID02: Already read notification - Failure (filtered out by query)
        [Fact]
        public async Task UTCID02_MarkAsReadAsync_WithAlreadyReadNotification_ShouldReturnFailure()
        {
            // Arrange
            // Already read notifications are filtered out by !n.IsRead in query
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.MarkAsReadAsync(NotificationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Notification not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID03: Non-existent notification - Failure
        [Fact]
        public async Task UTCID03_MarkAsReadAsync_WithNonExistentNotification_ShouldReturnFailure()
        {
            // Arrange
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.MarkAsReadAsync(NotificationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Notification not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID04: Deleted notification - Failure (filtered out by query)
        [Fact]
        public async Task UTCID04_MarkAsReadAsync_WithDeletedNotification_ShouldReturnFailure()
        {
            // Arrange
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.MarkAsReadAsync(NotificationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Notification not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        #endregion

        #region MarkAllAsReadAsync Tests

        // UTCID01: Valid unread notifications - Success
        [Fact]
        public async Task UTCID01_MarkAllAsReadAsync_WithUnreadNotifications_ShouldReturnSuccess()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = Guid.NewGuid(), UserId = UserId, IsRead = false },
                new Notification { Id = Guid.NewGuid(), UserId = UserId, IsRead = false }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.UpdateRangeAsync(It.IsAny<List<Notification>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.MarkAllAsReadAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.UpdateRangeAsync(It.Is<List<Notification>>(n => 
                n.All(notif => notif.IsRead == true && notif.ReadAt.HasValue))), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        // UTCID02: No unread notifications - Failure
        [Fact]
        public async Task UTCID02_MarkAllAsReadAsync_WithNoUnreadNotifications_ShouldReturnFailure()
        {
            // Arrange
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.MarkAllAsReadAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Notification not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.NotificationRepository.UpdateRangeAsync(It.IsAny<List<Notification>>()), Times.Never);
        }

        // UTCID03: All notifications already read - Failure
        [Fact]
        public async Task UTCID03_MarkAllAsReadAsync_WithAllReadNotifications_ShouldReturnFailure()
        {
            // Arrange
            // Read notifications are filtered out by !n.IsRead in query
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.MarkAllAsReadAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Notification not found");
        }

        // UTCID04: Single unread notification - Success
        [Fact]
        public async Task UTCID04_MarkAllAsReadAsync_WithSingleUnreadNotification_ShouldReturnSuccess()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = NotificationId, UserId = UserId, IsRead = false }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.UpdateRangeAsync(It.IsAny<List<Notification>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.MarkAllAsReadAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.UpdateRangeAsync(It.Is<List<Notification>>(n => n.Count == 1)), Times.Once);
        }
        #endregion

        #region DeleteIsReadNotificationsAsync Tests

        // UTCID01: Valid read notifications - Success
        [Fact]
        public async Task UTCID01_DeleteIsReadNotificationsAsync_WithReadNotifications_ShouldReturnSuccess()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = Guid.NewGuid(), UserId = UserId, IsRead = true },
                new Notification { Id = Guid.NewGuid(), UserId = UserId, IsRead = true }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.DeleteIsReadNotificationsAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()), Times.Exactly(2));
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        // UTCID02: No read notifications - Failure
        [Fact]
        public async Task UTCID02_DeleteIsReadNotificationsAsync_WithNoReadNotifications_ShouldReturnFailure()
        {
            // Arrange
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);

            // Act
            var result = await _notificationService.DeleteIsReadNotificationsAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Notification not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()), Times.Never);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never);
        }

        // UTCID03: Single read notification - Success
        [Fact]
        public async Task UTCID03_DeleteIsReadNotificationsAsync_WithSingleReadNotification_ShouldReturnSuccess()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = NotificationId, UserId = UserId, IsRead = true }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.DeleteIsReadNotificationsAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()), Times.Once);
        }

        // UTCID04: Unread notifications not deleted - Success
        [Fact]
        public async Task UTCID04_DeleteIsReadNotificationsAsync_WithUnreadNotifications_ShouldNotDeleteUnread()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = Guid.NewGuid(), UserId = UserId, IsRead = true },
                new Notification { Id = Guid.NewGuid(), UserId = UserId, IsRead = false } // Should not be deleted
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.DeleteIsReadNotificationsAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            // Only read notifications should be deleted (filtered by IsRead == true in query)
            _mockUnitOfWork.Verify(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()), Times.Once);
        }

        // UTCID05: Deleted notifications filtered out - Success
        [Fact]
        public async Task UTCID05_DeleteIsReadNotificationsAsync_WithDeletedNotifications_ShouldFilterDeleted()
        {
            // Arrange
            var notifications = new List<Notification>
            {
                new Notification { Id = NotificationId, UserId = UserId, IsRead = true, IsDeleted = false },
                new Notification { Id = Guid.NewGuid(), UserId = UserId, IsRead = true, IsDeleted = true } // Should be filtered
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.DeleteAsync(It.IsAny<Notification>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _notificationService.DeleteIsReadNotificationsAsync(UserId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            // Only non-deleted notifications should be deleted (filtered by !n.IsDeleted in query)
            _mockUnitOfWork.Verify(x => x.NotificationRepository.DeleteAsync(It.Is<Notification>(n => !n.IsDeleted)), Times.Once);
        }

        #endregion
    }
}
