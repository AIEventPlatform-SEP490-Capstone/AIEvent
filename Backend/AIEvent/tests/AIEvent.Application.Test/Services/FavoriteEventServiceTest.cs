using AIEvent.Application.Constants;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class FavoriteEventServiceTest
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<UserManager<AppUser>> _mockUserManager;
        private readonly IFavoriteEventService _favoriteeventService;
        public FavoriteEventServiceTest()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();

            var store = new Mock<IUserStore<AppUser>>();
            _mockUserManager = new Mock<UserManager<AppUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!
            );

            _favoriteeventService = new FavoriteEventService(_mockUnitOfWork.Object,
                                                            _mockTransactionHelper.Object,
                                                            _mockUserManager.Object
                                                        );
        }

        #region AddFavoriteEvent
        [Fact]
        public async Task AddFavoriteEvent_WithValidRequest_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var user = new AppUser
            {
                Id = userId,
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = true
            };

            var fevent = new FavoriteEvent
            {
                UserId = userId,
                EventId = eventId,
                CreatedAt = DateTime.UtcNow,
            };

            var eventDB = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = ConfirmStatus.Approve,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventDB);
            _mockUnitOfWork.Setup(x => x.FavoriteEventRepository.AddAsync(fevent));
            var result = await _favoriteeventService.AddFavoriteEvent(userId, eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task AddFavoriteEvent_WithUserInActive_ShouldReturnFailureResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var user = new AppUser
            {
                Id = userId,
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = false
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);
            var result = await _favoriteeventService.AddFavoriteEvent(userId, eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task AddFavoriteEvent_WithNoUser_ShouldReturnFailureResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = false
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);
            var result = await _favoriteeventService.AddFavoriteEvent(userId, eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        [Fact]
        public async Task AddFavoriteEvent_WithNoEvent_ShouldReturnFailureResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var user = new AppUser
            {
                Id = userId,
                Email = "test@gmail.com",
                UserName = "Test",
                FullName = "Test User",
                IsActive = true
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

            var users = new List<AppUser> { user }.AsQueryable().BuildMockDbSet();
            _mockUserManager.Setup(x => x.Users).Returns(users.Object);

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync((Event?) null);

            var result = await _favoriteeventService.AddFavoriteEvent(userId, eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }
        #endregion

        #region RemoveFavoriteEvent
        [Fact]
        public async Task RemoveFavoriteEvent_WithValidRequest_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            var feventDB = new FavoriteEvent
            {
                UserId = userId,
                EventId = eventId,
                CreatedAt = DateTime.UtcNow,
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var fevent = new List<FavoriteEvent> { feventDB }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.FavoriteEventRepository.Query(false)).Returns(fevent.Object);

            _mockUnitOfWork.Setup(x => x.FavoriteEventRepository.DeleteAsync(feventDB));

            var result = await _favoriteeventService.RemoveFavoriteEvent(userId, eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task RemoveFavoriteEvent_WithNoEvent_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            var feventDB = new FavoriteEvent
            {
                UserId = userId,
                EventId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var fevent = new List<FavoriteEvent> { feventDB }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.FavoriteEventRepository.Query(false)).Returns(fevent.Object);

            _mockUnitOfWork.Setup(x => x.FavoriteEventRepository.DeleteAsync(feventDB));

            var result = await _favoriteeventService.RemoveFavoriteEvent(userId, eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Favorite event not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }
        #endregion
    }
}
