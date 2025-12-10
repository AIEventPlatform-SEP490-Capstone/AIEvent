using AIEvent.Application.Constants;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class FavoriteEventServiceTest
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly IFavoriteEventService _favoriteeventService;
        public FavoriteEventServiceTest()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();

            _favoriteeventService = new FavoriteEventService(_mockUnitOfWork.Object,
                                                            _mockTransactionHelper.Object
                                                        );
        }

        #region AddFavoriteEvent
        [Fact]
        public async Task AddFavoriteEvent_WithValidRequest_ShouldReturnSuccessResult()
        {
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
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
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                TotalTickets = 100, 
                Status = EventStatus.Approved,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

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
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = false
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);
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
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = false
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);
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
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                FullName = "Test User",
                IsActive = true
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
               .Returns<Func<Task<Result>>>(func => func());

            var users = new List<User> { user }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.UserRepository.Query(false)).Returns(users.Object);

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

        #region GetFavoriteEvent
        [Fact]
        public async Task GetFavoriteEvent_WithValidUserId_ShouldReturnSuccessResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
            var eventId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId2 = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var eventCategory = new EventCategory
            {
                Id = eventCategoryId,
                CategoryName = "Music"
            };

            var events = new List<Event>
            {
                new Event
                {
                    Id = eventId1,
                    Title = "Test Event 1",
                    Description = "Test Description 1",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    LocationName = "Location 1",
                    Status = EventStatus.Approved,
                    DeletedAt = null,
                    EventCategoryId = eventCategoryId,
                    EventCategory = eventCategory,
                    Publish = true,
                    CreatedAt = DateTime.UtcNow,
                    AverageRating = 4.5,
                    TotalRatings = 10,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = userId, EventId = eventId1 }
                    },
                    TicketTypes = new List<TicketType>
                    {
                        new TicketType { TicketName = "Standard", TicketQuantity = 100, TicketPrice = 50 }
                    }
                },
                new Event
                {
                    Id = eventId2,
                    Title = "Test Event 2",
                    Description = "Test Description 2",
                    StartTime = DateTime.UtcNow.AddDays(2),
                    EndTime = DateTime.UtcNow.AddDays(2).AddHours(3),
                    TotalTickets = 200,
                    SoldQuantity = 50,
                    LocationName = "Location 2",
                    Status = EventStatus.Approved,
                    DeletedAt = null,
                    EventCategoryId = eventCategoryId,
                    EventCategory = eventCategory,
                    Publish = true,
                    CreatedAt = DateTime.UtcNow.AddMinutes(10),
                    AverageRating = 4.0,
                    TotalRatings = 5,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = userId, EventId = eventId2 }
                    },
                    TicketTypes = new List<TicketType>
                    {
                        new TicketType { TicketName = "VIP", TicketQuantity = 200, TicketPrice = 100 }
                    }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _favoriteeventService.GetFavoriteEvent(userId, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value.Items.First().EventId.Should().Be(eventId1);
            result.Value.Items.First().Title.Should().Be("Test Event 1");
            result.Value.Items.First().IsFavorite.Should().BeTrue();
            result.Value.TotalItems.Should().Be(2);
        }

        [Fact]
        public async Task GetFavoriteEvent_WithSearchFilter_ShouldReturnFilteredResults()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
            var eventId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId2 = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var eventCategory = new EventCategory
            {
                Id = eventCategoryId,
                CategoryName = "Music"
            };

            var events = new List<Event>
            {
                new Event
                {
                    Id = eventId1,
                    Title = "Music Concert",
                    Description = "Test Description 1",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    Status = EventStatus.Approved,
                    DeletedAt = null,
                    EventCategoryId = eventCategoryId,
                    EventCategory = eventCategory,
                    CreatedAt = DateTime.UtcNow,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = userId, EventId = eventId1 }
                    },
                    TicketTypes = new List<TicketType>
                    {
                        new TicketType { TicketName = "Standard", TicketQuantity = 100, TicketPrice = 50 }
                    }
                },
                new Event
                {
                    Id = eventId2,
                    Title = "Sports Event",
                    Description = "Test Description 2",
                    StartTime = DateTime.UtcNow.AddDays(2),
                    EndTime = DateTime.UtcNow.AddDays(2).AddHours(3),
                    TotalTickets = 200,
                    SoldQuantity = 50,
                    Status = EventStatus.Approved,
                    DeletedAt = null,
                    EventCategoryId = eventCategoryId,
                    EventCategory = eventCategory,
                    CreatedAt = DateTime.UtcNow.AddMinutes(10),
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = userId, EventId = eventId2 }
                    },
                    TicketTypes = new List<TicketType>
                    {
                        new TicketType { TicketName = "VIP", TicketQuantity = 200, TicketPrice = 100 }
                    }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _favoriteeventService.GetFavoriteEvent(userId, "Music", null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().Title.Should().Be("Music Concert");
            result.Value.TotalItems.Should().Be(1);
        }

        [Fact]
        public async Task GetFavoriteEvent_WithCategoryFilter_ShouldReturnFilteredResults()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var eventCategoryId1 = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
            var eventCategoryId2 = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
            var eventId1 = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId2 = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var eventCategory1 = new EventCategory
            {
                Id = eventCategoryId1,
                CategoryName = "Music"
            };

            var eventCategory2 = new EventCategory
            {
                Id = eventCategoryId2,
                CategoryName = "Sports"
            };

            var events = new List<Event>
            {
                new Event
                {
                    Id = eventId1,
                    Title = "Music Concert",
                    Description = "Test Description 1",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    Status = EventStatus.Approved,
                    DeletedAt = null,
                    EventCategoryId = eventCategoryId1,
                    EventCategory = eventCategory1,
                    CreatedAt = DateTime.UtcNow,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = userId, EventId = eventId1 }
                    },
                    TicketTypes = new List<TicketType>
                    {
                        new TicketType { TicketName = "Standard", TicketQuantity = 100, TicketPrice = 50 }
                    }
                },
                new Event
                {
                    Id = eventId2,
                    Title = "Sports Event",
                    Description = "Test Description 2",
                    StartTime = DateTime.UtcNow.AddDays(2),
                    EndTime = DateTime.UtcNow.AddDays(2).AddHours(3),
                    TotalTickets = 200,
                    SoldQuantity = 50,
                    Status = EventStatus.Approved,
                    DeletedAt = null,
                    EventCategoryId = eventCategoryId2,
                    EventCategory = eventCategory2,
                    CreatedAt = DateTime.UtcNow.AddMinutes(10),
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = userId, EventId = eventId2 }
                    },
                    TicketTypes = new List<TicketType>
                    {
                        new TicketType { TicketName = "VIP", TicketQuantity = 200, TicketPrice = 100 }
                    }
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _favoriteeventService.GetFavoriteEvent(userId, null, eventCategoryId1.ToString(), 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(1);
            result.Value.Items.First().EventId.Should().Be(eventId1);
            result.Value.Items.First().EventCategoryName.Should().Be("Music");
            result.Value.TotalItems.Should().Be(1);
        }

        [Fact]
        public async Task GetFavoriteEvent_WithNoFavoriteEvents_ShouldReturnEmptyResult()
        {
            // Arrange
            var userId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var otherUserId = Guid.Parse("99999999-9999-9999-9999-999999999999");

            var events = new List<Event>
            {
                new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Test Event",
                    Description = "Test Description",
                    StartTime = DateTime.UtcNow.AddDays(1),
                    EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                    TotalTickets = 100,
                    SoldQuantity = 0,
                    Status = EventStatus.Approved,
                    DeletedAt = null,
                    EventCategoryId = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    EventTags = new List<EventTag>(),
                    FavoriteEvents = new List<FavoriteEvent>
                    {
                        new FavoriteEvent { UserId = otherUserId, EventId = Guid.NewGuid() }
                    },
                    TicketTypes = new List<TicketType>()
                }
            }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            var result = await _favoriteeventService.GetFavoriteEvent(userId, null, null, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value.TotalItems.Should().Be(0);
        }
        #endregion
    }
}
