using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
using Hangfire;
using Hangfire.MemoryStorage;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class EventInvitationServiceTests
    {
        // Fixed Test IDs
        private static readonly Guid TestUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid TestEventId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid TestFriendId1 = Guid.Parse("33333333-3333-3333-3333-333333333333");
        private static readonly Guid TestFriendId2 = Guid.Parse("44444444-4444-4444-4444-444444444444");
        private static readonly Guid TestInvitationId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        private static readonly Guid TestInviterId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        private static readonly Guid TestFriendshipId1 = Guid.Parse("77777777-7777-7777-7777-777777777777");
        private static readonly Guid TestFriendshipId2 = Guid.Parse("88888888-8888-8888-8888-888888888888");

        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IHangfireJobService> _mockHangfireJobService;
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly IEventInvitationService _eventInvitationService;

        static EventInvitationServiceTests()
        {
            // Setup Hangfire with MemoryStorage for tests (static constructor to run once)
            GlobalConfiguration.Configuration.UseMemoryStorage();
        }

        public EventInvitationServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockHangfireJobService = new Mock<IHangfireJobService>();
            _mockNotificationService = new Mock<INotificationService>();
            _eventInvitationService = new EventInvitationService(
                _mockUnitOfWork.Object,
                _mockHangfireJobService.Object,
                _mockNotificationService.Object);
        }

        private Event CreateEvent(Guid eventId, string title, string? imgListEvent = null, DateTime? startTime = null)
        {
            var now = DateTime.UtcNow;
            return new Event
            {
                Id = eventId,
                Title = title,
                Description = "Test Description",
                StartTime = startTime ?? now.AddDays(1),
                EndTime = (startTime ?? now.AddDays(1)).AddHours(2),
                ImgListEvent = imgListEvent
            };
        }

        private void SetupHangfireMockForInviteEmail(int times = 1)
        {
            _mockHangfireJobService.Setup(x => x.EnqueueInviteEmail(It.IsAny<InviteFriendEmail>()))
                .Returns(Task.CompletedTask);
        }

        private void SetupHangfireMockForConfirmEmail(int times = 1)
        {
            _mockHangfireJobService.Setup(x => x.EnqueueConfirmEmail(It.IsAny<ConfirmInvitationEmail>()))
                .Returns(Task.CompletedTask);
        }

        #region InviteFriendsAsync Tests

        // UTCID01: Valid request with all required fields - Success
        // EP: Valid input (non-empty InvitedUserIds, valid user, valid event), BV: Multiple friends
        [Fact]
        public async Task UTCID01_InviteFriendsAsync_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var friendId1 = Guid.NewGuid();
            var friendId2 = Guid.NewGuid();
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { friendId1, friendId2 },
                Message = "Join us at this event!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg, image2.jpg");
            eventEntity.Status = EventStatus.Approved;
            eventEntity.Publish = true;

            var friendship1 = new Friendship
            {
                Id = TestFriendshipId1,
                SenderId = userId,
                ReceiverId = friendId1,
                Status = FriendshipStatus.Accepted,
                IsDeleted = false
            };

            var friendship2 = new Friendship
            {
                Id = TestFriendshipId2,
                SenderId = friendId2,
                ReceiverId = userId,
                Status = FriendshipStatus.Accepted,
                IsDeleted = false
            };

            var friend1 = new User
            {
                Id = friendId1,
                Email = "friend1@example.com",
                FullName = "Friend 1",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var friend2 = new User
            {
                Id = friendId2,
                Email = "friend2@example.com",
                FullName = "Friend 2",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var friendships = new List<Friendship> { friendship1, friendship2 }.AsQueryable().BuildMockDbSet();
            var users = new List<User> { friend1, friend2 }.AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet();
            var existingInvitations = new List<EventInvitation>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.FriendshipRepository.Query(It.IsAny<bool>())).Returns(friendships.Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(existingInvitations.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.AddRangeAsync(It.IsAny<IEnumerable<EventInvitation>>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            SetupHangfireMockForInviteEmail(2);
            _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
                .ReturnsAsync(Result.Success());

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.Query(It.IsAny<bool>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.FriendshipRepository.Query(It.IsAny<bool>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.UserRepository.Query(It.IsAny<bool>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.Query(It.IsAny<bool>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.AddRangeAsync(It.Is<IEnumerable<EventInvitation>>(invitations =>
                invitations.Count() == 2 &&
                invitations.All(i => i.EventId == eventId && i.InviterId == userId && i.Status == InvitationStatus.Pending)
            )), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
            _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(
                req => req.UserId == friendId1 &&
                       req.Type == NotificationType.EventInvitation &&
                       req.Title == "Lời mời tham gia sự kiện" &&
                       req.EventId == eventId)), Times.Once());
            _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(
                req => req.UserId == friendId2 &&
                       req.Type == NotificationType.EventInvitation &&
                       req.Title == "Lời mời tham gia sự kiện" &&
                       req.EventId == eventId)), Times.Once());
        }

        // UTCID02: Null InvitedUserIds - Should return failure
        // EP: Invalid input (null InvitedUserIds), BV: null value
        [Fact]
        public async Task UTCID02_InviteFriendsAsync_WithNullInvitedUserIds_ShouldReturnFailure()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = null,
                Message = "Join us!"
            };

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("No invited users provided.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }
 
        // UTCID03: User not found - Should return failure
        // EP: Invalid input (non-existent user), BV: null user
        [Fact]
        public async Task UTCID03_InviteFriendsAsync_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { TestFriendId1 },
                Message = "Join us!"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.Query(It.IsAny<bool>()), Times.Never());
        }

        // UTCID04: User is deleted - Should return failure
        // EP: Invalid input (deleted user), BV: IsDeleted = true
        [Fact]
        public async Task UTCID04_InviteFriendsAsync_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { TestFriendId1 },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.Query(It.IsAny<bool>()), Times.Never());
        }

        // UTCID05: Event not found - Should return failure
        // EP: Invalid input (non-existent event), BV: null event
        [Fact]
        public async Task UTCID05_InviteFriendsAsync_WithNonExistentEvent_ShouldReturnFailure()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { TestFriendId1 },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var events = new List<Event>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.Query(It.IsAny<bool>()), Times.Once());
        }

        // UTCID06: Event not approved - Should return failure
        // EP: Invalid input (event status != Approved), BV: Status = PendingApproval
        [Fact]
        public async Task UTCID06_InviteFriendsAsync_WithEventNotApproved_ShouldReturnFailure()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { TestFriendId1 },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event");
            eventEntity.Status = EventStatus.PendingApproval;
            eventEntity.Publish = true;

            var events = new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID07: Past event - Should return failure
        // EP: Invalid input (StartTime < UtcNow), BV: StartTime = UtcNow - 1 second
        [Fact]
        public async Task UTCID07_InviteFriendsAsync_WithPastEvent_ShouldReturnFailure()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { TestFriendId1 },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", null, DateTime.UtcNow.AddDays(-1));
            eventEntity.Status = EventStatus.Approved;
            eventEntity.Publish = true;

            var events = new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Cannot invite users to past events.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID08: Event start time in future (boundary) - Should proceed
        // BV: StartTime = UtcNow + 1 second (boundary value)
        [Fact]
        public async Task UTCID08_InviteFriendsAsync_WithEventStartTimeInFuture_Boundary_ShouldReturnSuccess()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var friendId = TestFriendId1;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { friendId },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg", DateTime.UtcNow.AddSeconds(1));
            eventEntity.Status = EventStatus.Approved;
            eventEntity.Publish = true;

            var friendship = new Friendship
            {
                Id = TestFriendshipId1,
                SenderId = userId,
                ReceiverId = friendId,
                Status = FriendshipStatus.Accepted,
                IsDeleted = false
            };

            var friend = new User
            {
                Id = friendId,
                Email = "friend@example.com",
                FullName = "Friend",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var friendships = new List<Friendship> { friendship }.AsQueryable().BuildMockDbSet();
            var users = new List<User> { friend }.AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet();
            var existingInvitations = new List<EventInvitation>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.FriendshipRepository.Query(It.IsAny<bool>())).Returns(friendships.Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(existingInvitations.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.AddRangeAsync(It.IsAny<IEnumerable<EventInvitation>>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            SetupHangfireMockForInviteEmail();
            _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
                .ReturnsAsync(Result.Success());

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID09: No valid users to invite (not friends) - Should return failure
        // EP: Invalid input (users not in friend list), BV: empty friend list
        [Fact]
        public async Task UTCID09_InviteFriendsAsync_WithUsersNotFriends_ShouldReturnFailure()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var nonFriendId = TestFriendId1;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { nonFriendId },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event");
            eventEntity.Status = EventStatus.Approved;
            eventEntity.Publish = true;

            var friendships = new List<Friendship>().AsQueryable().BuildMockDbSet();
            var users = new List<User>().AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.FriendshipRepository.Query(It.IsAny<bool>())).Returns(friendships.Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("No valid users found to invite.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID10: User already invited - Should skip existing invitations
        // EP: Valid input (some users already invited), BV: partial existing invitations
        [Fact]
        public async Task UTCID10_InviteFriendsAsync_WithAlreadyInvitedUser_ShouldSkipAndReturnSuccess()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var friendId1 = TestFriendId1;
            var friendId2 = TestFriendId2;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { friendId1, friendId2 },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");
            eventEntity.Status = EventStatus.Approved;
            eventEntity.Publish = true;

            var friendship1 = new Friendship
            {
                Id = TestFriendshipId1,
                SenderId = userId,
                ReceiverId = friendId1,
                Status = FriendshipStatus.Accepted,
                IsDeleted = false
            };

            var friendship2 = new Friendship
            {
                Id = TestFriendshipId2,
                SenderId = userId,
                ReceiverId = friendId2,
                Status = FriendshipStatus.Accepted,
                IsDeleted = false
            };

            var friend1 = new User
            {
                Id = friendId1,
                Email = "friend1@example.com",
                FullName = "Friend 1",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var friend2 = new User
            {
                Id = friendId2,
                Email = "friend2@example.com",
                FullName = "Friend 2",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var existingInvitation = new EventInvitation
            {
                Id = TestInvitationId,
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = friendId1,
                Status = InvitationStatus.Pending,
                IsDeleted = false
            };

            var friendships = new List<Friendship> { friendship1, friendship2 }.AsQueryable().BuildMockDbSet();
            var users = new List<User> { friend1, friend2 }.AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet();
            var existingInvitations = new List<EventInvitation> { existingInvitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.FriendshipRepository.Query(It.IsAny<bool>())).Returns(friendships.Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(existingInvitations.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.AddRangeAsync(It.IsAny<IEnumerable<EventInvitation>>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.AddRangeAsync(It.Is<IEnumerable<EventInvitation>>(invitations =>
                invitations.Count() == 1 &&
                invitations.First().InvitedUserId == friendId2
            )), Times.Once());
        }

        // UTCID11: User with email notification disabled - Should not send email
        // EP: Valid input (email notification disabled), BV: IsEmailNotificationEnabled = false
        [Fact]
        public async Task UTCID11_InviteFriendsAsync_WithEmailNotificationDisabled_ShouldNotSendEmail()
        {
            // Arrange
            var eventId = TestEventId;
            var userId = TestUserId;
            var friendId = TestFriendId1;
            var request = new InviteFriendRequest
            {
                InvitedUserIds = new List<Guid> { friendId },
                Message = "Join us!"
            };

            var userInviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");
            eventEntity.Status = EventStatus.Approved;
            eventEntity.Publish = true;

            var friendship = new Friendship
            {
                Id = TestFriendshipId1,
                SenderId = userId,
                ReceiverId = friendId,
                Status = FriendshipStatus.Accepted,
                IsDeleted = false
            };

            var friend = new User
            {
                Id = friendId,
                Email = "friend@example.com",
                FullName = "Friend",
                IsEmailNotificationEnabled = false,
                IsDeleted = false
            };

            var friendships = new List<Friendship> { friendship }.AsQueryable().BuildMockDbSet();
            var users = new List<User> { friend }.AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet();
            var existingInvitations = new List<EventInvitation>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(userInviter);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.FriendshipRepository.Query(It.IsAny<bool>())).Returns(friendships.Object);
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(It.IsAny<bool>())).Returns(users.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(existingInvitations.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.AddRangeAsync(It.IsAny<IEnumerable<EventInvitation>>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
                .ReturnsAsync(Result.Success());

            // Act
            var result = await _eventInvitationService.InviteFriendsAsync(eventId, userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.AddRangeAsync(It.IsAny<IEnumerable<EventInvitation>>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
            _mockHangfireJobService.Verify(x => x.EnqueueInviteEmail(It.IsAny<InviteFriendEmail>()), Times.Never());
        }
        #endregion

        #region ConfirmInvitationAsync Tests

        // UTCID01: Valid request with Approved status - Success
        // EP: Valid input (Approved status), BV: Status = Approved
        [Fact]
        public async Task UTCID01_ConfirmInvitationAsync_WithApprovedStatus_ShouldReturnSuccess()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var inviterId = TestInviterId;
            var eventId = TestEventId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var inviter = new User
            {
                Id = inviterId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg, image2.jpg");

            var invitation = new EventInvitation
            {
                Id = invitationId,
                EventId = eventId,
                InviterId = inviterId,
                InvitedUserId = userId,
                Status = null,
                Message = "Join us!",
                Event = eventEntity,
                Inviter = inviter,
                IsDeleted = false
            };

            var invitations = new List<EventInvitation> { invitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            SetupHangfireMockForConfirmEmail();
            _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
                .ReturnsAsync(Result.Success());

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.UpdateAsync(It.Is<EventInvitation>(i =>
                i.Id == invitationId &&
                i.Status == InvitationStatus.Accepted &&
                i.RespondedAt.HasValue
            )), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
            _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(
                req => req.UserId == inviterId &&
                       req.Type == NotificationType.EventInvitationAccepted &&
                       req.Title == "Lời mời đã được chấp nhận" &&
                       req.EventId == eventId)), Times.Once());
        }

        // UTCID02: Valid request with Rejected status - Success
        // EP: Valid input (Rejected status), BV: Status = Rejected
        [Fact]
        public async Task UTCID02_ConfirmInvitationAsync_WithRejectedStatus_ShouldReturnSuccess()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var inviterId = TestInviterId;
            var eventId = TestEventId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Rejected
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var inviter = new User
            {
                Id = inviterId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");

            var invitation = new EventInvitation
            {
                Id = invitationId,
                EventId = eventId,
                InviterId = inviterId,
                InvitedUserId = userId,
                Status = null,
                Message = "Join us!",
                Event = eventEntity,
                Inviter = inviter,
                IsDeleted = false
            };

            var invitations = new List<EventInvitation> { invitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockNotificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
                .ReturnsAsync(Result.Success());

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.UpdateAsync(It.Is<EventInvitation>(i =>
                i.Id == invitationId &&
                i.Status == InvitationStatus.Rejected &&
                i.RespondedAt.HasValue
            )), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
            _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(
                req => req.UserId == inviterId &&
                       req.Type == NotificationType.EventInvitationRejected &&
                       req.Title == "Lời mời đã bị từ chối" &&
                       req.EventId == eventId)), Times.Once());
        }

        // UTCID03: User not found - Should return failure
        // EP: Invalid input (non-existent user), BV: null user
        [Fact]
        public async Task UTCID03_ConfirmInvitationAsync_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User does not exist.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.Query(It.IsAny<bool>()), Times.Never());
        }

        // UTCID04: User is deleted - Should return failure
        // EP: Invalid input (deleted user), BV: IsDeleted = true
        [Fact]
        public async Task UTCID04_ConfirmInvitationAsync_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var deletedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(deletedUser);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User does not exist.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.Query(It.IsAny<bool>()), Times.Never());
        }

        // UTCID05: Invitation not found - Should return failure
        // EP: Invalid input (non-existent invitation), BV: null invitation
        [Fact]
        public async Task UTCID05_ConfirmInvitationAsync_WithNonExistentInvitation_ShouldReturnFailure()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var invitations = new List<EventInvitation>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("The invitation does not exist or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.Query(It.IsAny<bool>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()), Times.Never());
        }

        // UTCID06: Invitation with different userId - Should return failure
        // EP: Invalid input (different userId), BV: InvitedUserId != userId
        [Fact]
        public async Task UTCID06_ConfirmInvitationAsync_WithDifferentUserId_ShouldReturnFailure()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var otherUserId = TestFriendId1;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var invitation = new EventInvitation
            {
                Id = invitationId,
                InvitedUserId = otherUserId,
                IsDeleted = false
            };

            var invitations = new List<EventInvitation> { invitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("The invitation does not exist or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()), Times.Never());
        }

        // UTCID07: Invitation is deleted - Should return failure
        // EP: Invalid input (deleted invitation), BV: IsDeleted = true
        [Fact]
        public async Task UTCID07_ConfirmInvitationAsync_WithDeletedInvitation_ShouldReturnFailure()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var invitation = new EventInvitation
            {
                Id = invitationId,
                InvitedUserId = userId,
                IsDeleted = true
            };

            var invitations = new List<EventInvitation> { invitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("The invitation does not exist or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()), Times.Never());
        }

        // UTCID08: Inviter is null - Should return failure
        // EP: Invalid input (null inviter), BV: Inviter = null
        [Fact]
        public async Task UTCID08_ConfirmInvitationAsync_WithNullInviter_ShouldReturnFailure()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var inviterId = TestInviterId;
            var eventId = TestEventId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event");

            var invitation = new EventInvitation
            {
                Id = invitationId,
                EventId = eventId,
                InviterId = inviterId,
                InvitedUserId = userId,
                Status = null,
                Event = eventEntity,
                Inviter = null!,
                IsDeleted = false
            };

            var invitations = new List<EventInvitation> { invitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("The invite sender does not exist.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        // UTCID09: Inviter is deleted - Should return failure
        // EP: Invalid input (deleted inviter), BV: IsDeleted = true
        [Fact]
        public async Task UTCID09_ConfirmInvitationAsync_WithDeletedInviter_ShouldReturnFailure()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var inviterId = TestInviterId;
            var eventId = TestEventId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var deletedInviter = new User
            {
                Id = inviterId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = true
            };

            var eventEntity = CreateEvent(eventId, "Test Event");

            var invitation = new EventInvitation
            {
                Id = invitationId,
                EventId = eventId,
                InviterId = inviterId,
                InvitedUserId = userId,
                Status = null,
                Event = eventEntity,
                Inviter = deletedInviter,
                IsDeleted = false
            };

            var invitations = new List<EventInvitation> { invitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("The invite sender does not exist.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }

        // UTCID10: InviterId is Guid.Empty - Should not send notification
        // EP: Valid input (InviterId = Guid.Empty), BV: InviterId = Guid.Empty
        [Fact]
        public async Task UTCID10_ConfirmInvitationAsync_WithEmptyInviterId_ShouldNotSendNotification()
        {
            // Arrange
            var invitationId = TestInvitationId;
            var userId = TestUserId;
            var inviterId = Guid.Empty; // Empty Guid
            var eventId = TestEventId;
            var request = new ConfirmInvitationRequest
            {
                Status = ConfirmStatus.Approved
            };

            var invitedUser = new User
            {
                Id = userId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var inviter = new User
            {
                Id = inviterId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsEmailNotificationEnabled = true,
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");

            var invitation = new EventInvitation
            {
                Id = invitationId,
                EventId = eventId,
                InviterId = inviterId, // Empty Guid
                InvitedUserId = userId,
                Status = null,
                Message = "Join us!",
                Event = eventEntity,
                Inviter = inviter,
                IsDeleted = false
            };

            var invitations = new List<EventInvitation> { invitation }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(invitedUser);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>())).Returns(invitations.Object);
            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.UpdateAsync(It.IsAny<EventInvitation>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _eventInvitationService.ConfirmInvitationAsync(invitationId, userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockNotificationService.Verify(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()), Times.Never());
        }

        #endregion

        #region GetInviteFriendsByStatus Tests

        // UTCID01: Valid request with status null - should return all invitations
        // EP: Valid input (status = null), BV: null status
        [Fact]
        public async Task UTCID01_GetInviteFriendsByStatus_WithStatusNull_ShouldReturnAllInvitations()
        {
            // Arrange
            var userId = TestUserId;
            var eventId = TestEventId;
            var invitedUserId = TestFriendId1;
            var now = DateTimeOffset.UtcNow;

            var inviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var invitedUser = new User
            {
                Id = invitedUserId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg, image2.jpg");
            eventEntity.Status = EventStatus.Approved;

            var invitation1 = new EventInvitation
            {
                Id = TestInvitationId,
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Test message",
                Status = InvitationStatus.Pending,
                CreatedAt = now.AddDays(-2),
                RespondedAt = null,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitation2 = new EventInvitation
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Test message 2",
                Status = InvitationStatus.Accepted,
                CreatedAt = now.AddDays(-1),
                RespondedAt = now.DateTime,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitations = new List<EventInvitation> { invitation1, invitation2 }
                .AsQueryable()
                .BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>()))
                .Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.GetInviteFriendsByStatusAsync(userId, null, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(10);
            result.Value!.Items.Should().BeInDescendingOrder(x => x.CreatedAt);
        }

        // UTCID02: Valid request with status Pending - should return only pending invitations
        // EP: Valid input (status = Pending), BV: Status = Pending
        [Fact]
        public async Task UTCID02_GetInviteFriendsByStatus_WithStatusPending_ShouldReturnOnlyPendingInvitations()
        {
            // Arrange
            var userId = TestUserId;
            var eventId = TestEventId;
            var invitedUserId = TestFriendId1;
            var now = DateTimeOffset.UtcNow;

            var inviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var invitedUser = new User
            {
                Id = invitedUserId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");
            eventEntity.Status = EventStatus.Approved;

            var pendingInvitation = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Pending message",
                Status = InvitationStatus.Pending,
                CreatedAt = now,
                RespondedAt = null,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var acceptedInvitation = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Accepted message",
                Status = InvitationStatus.Accepted,
                CreatedAt = now,
                RespondedAt = now.DateTime,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitations = new List<EventInvitation> { pendingInvitation, acceptedInvitation }
                .AsQueryable()
                .BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>()))
                .Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.GetInviteFriendsByStatusAsync(userId, InvitationStatus.Pending, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(1);
            result.Value!.Items.First().Status.Should().Be(InvitationStatus.Pending);
        }

        // UTCID03: Valid request with status Accepted - should return only accepted invitations
        // EP: Valid input (status = Accepted), BV: Status = Accepted
        [Fact]
        public async Task UTCID03_GetInviteFriendsByStatus_WithStatusAccepted_ShouldReturnOnlyAcceptedInvitations()
        {
            // Arrange
            var userId = TestUserId;
            var eventId = TestEventId;
            var invitedUserId = TestFriendId1;
            var now = DateTimeOffset.UtcNow;

            var inviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var invitedUser = new User
            {
                Id = invitedUserId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");
            eventEntity.Status = EventStatus.Approved;

            var pendingInvitation = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Pending message",
                Status = InvitationStatus.Pending,
                CreatedAt = now,
                RespondedAt = null,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var acceptedInvitation = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Accepted message",
                Status = InvitationStatus.Accepted,
                CreatedAt = now,
                RespondedAt = now.DateTime,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitations = new List<EventInvitation> { pendingInvitation, acceptedInvitation }
                .AsQueryable()
                .BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>()))
                .Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.GetInviteFriendsByStatusAsync(userId, InvitationStatus.Accepted, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(1);
            result.Value!.Items.First().Status.Should().Be(InvitationStatus.Accepted);
        }

        // UTCID04: Valid request with status Rejected - should return only rejected invitations
        // EP: Valid input (status = Rejected), BV: Status = Rejected
        [Fact]
        public async Task UTCID04_GetInviteFriendsByStatus_WithStatusRejected_ShouldReturnOnlyRejectedInvitations()
        {
            // Arrange
            var userId = TestUserId;
            var eventId = TestEventId;
            var invitedUserId = TestFriendId1;
            var now = DateTimeOffset.UtcNow;

            var inviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var invitedUser = new User
            {
                Id = invitedUserId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");
            eventEntity.Status = EventStatus.Approved;

            var rejectedInvitation = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Rejected message",
                Status = InvitationStatus.Rejected,
                CreatedAt = now,
                RespondedAt = now.DateTime,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var acceptedInvitation = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Accepted message",
                Status = InvitationStatus.Accepted,
                CreatedAt = now,
                RespondedAt = now.DateTime,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitations = new List<EventInvitation> { rejectedInvitation, acceptedInvitation }
                .AsQueryable()
                .BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>()))
                .Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.GetInviteFriendsByStatusAsync(userId, InvitationStatus.Rejected, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(1);
            result.Value!.Items.First().Status.Should().Be(InvitationStatus.Rejected);
        }

        // UTCID05: Empty result set - should return empty paginated result
        // EP: Valid input (no invitations), BV: empty collection
        [Fact]
        public async Task UTCID05_GetInviteFriendsByStatus_WithEmptyResultSet_ShouldReturnEmptyPaginated()
        {
            // Arrange
            var userId = TestUserId;
            var invitations = new List<EventInvitation>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>()))
                .Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.GetInviteFriendsByStatusAsync(userId, null, 1, 10);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(10);
            result.Value!.TotalPages.Should().Be(0);
        }

        // UTCID06: Pagination - page 1 with page size 1 - should return first item
        // EP: Valid input (page 1, size 1), BV: page = 1, size = 1
        [Fact]
        public async Task UTCID06_GetInviteFriendsByStatus_WithPage1Size1_ShouldReturnFirstItem()
        {
            // Arrange
            var userId = TestUserId;
            var eventId = TestEventId;
            var invitedUserId = TestFriendId1;
            var now = DateTimeOffset.UtcNow;

            var inviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var invitedUser = new User
            {
                Id = invitedUserId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");
            eventEntity.Status = EventStatus.Approved;

            var invitation1 = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Message 1",
                Status = InvitationStatus.Pending,
                CreatedAt = now.AddDays(-2),
                RespondedAt = null,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitation2 = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Message 2",
                Status = InvitationStatus.Pending,
                CreatedAt = now.AddDays(-1),
                RespondedAt = null,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitations = new List<EventInvitation> { invitation1, invitation2 }
                .AsQueryable()
                .BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>()))
                .Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.GetInviteFriendsByStatusAsync(userId, null, 1, 1);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(1);
            result.Value!.TotalPages.Should().Be(2);
            result.Value!.Items.First().CreatedAt.Should().Be(invitation2.CreatedAt); // Should be ordered descending
        }

        // UTCID07: Pagination - page 2 with page size 1 - should return second item
        // EP: Valid input (page 2, size 1), BV: page = 2, size = 1
        [Fact]
        public async Task UTCID07_GetInviteFriendsByStatus_WithPage2Size1_ShouldReturnSecondItem()
        {
            // Arrange
            var userId = TestUserId;
            var eventId = TestEventId;
            var invitedUserId = TestFriendId1;
            var now = DateTimeOffset.UtcNow;

            var inviter = new User
            {
                Id = userId,
                Email = "inviter@example.com",
                FullName = "Inviter User",
                IsDeleted = false
            };

            var invitedUser = new User
            {
                Id = invitedUserId,
                Email = "invited@example.com",
                FullName = "Invited User",
                IsDeleted = false
            };

            var eventEntity = CreateEvent(eventId, "Test Event", "image1.jpg");
            eventEntity.Status = EventStatus.Approved;

            var invitation1 = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Message 1",
                Status = InvitationStatus.Pending,
                CreatedAt = now.AddDays(-2),
                RespondedAt = null,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitation2 = new EventInvitation
            {
                Id = Guid.NewGuid(),
                EventId = eventId,
                InviterId = userId,
                InvitedUserId = invitedUserId,
                Message = "Message 2",
                Status = InvitationStatus.Pending,
                CreatedAt = now.AddDays(-1),
                RespondedAt = null,
                IsDeleted = false,
                Event = eventEntity,
                Inviter = inviter,
                InvitedUser = invitedUser
            };

            var invitations = new List<EventInvitation> { invitation1, invitation2 }
                .AsQueryable()
                .BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventInvitationRepository.Query(It.IsAny<bool>()))
                .Returns(invitations.Object);

            // Act
            var result = await _eventInvitationService.GetInviteFriendsByStatusAsync(userId, null, 2, 1);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(2);
            result.Value!.PageSize.Should().Be(1);
            result.Value!.Items.First().CreatedAt.Should().Be(invitation1.CreatedAt);
        }
        #endregion
    }
}

