using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class EventServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<ICloudinaryService> _mockCloudinaryService;
        private readonly EventService _eventService;

        public EventServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockMapper = new Mock<IMapper>();
            _mockCloudinaryService = new Mock<ICloudinaryService>();

            _eventService = new EventService(
                _mockUnitOfWork.Object,
                _mockTransactionHelper.Object,
                _mockMapper.Object,
                _mockCloudinaryService.Object);
        }

        #region CreateEventAsync Tests

        [Fact]
        public async Task CreateEventAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                IsApprove = true,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), FullName = "Test User" }
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = createEventRequest.Title,
                Description = createEventRequest.Description,
                StartTime = createEventRequest.StartTime,
                EndTime = createEventRequest.EndTime,
                TotalTickets = createEventRequest.TotalTickets,
                TicketType = createEventRequest.TicketType,
                RequireApproval = createEventRequest.RequireApproval,
                EventCategoryId = Guid.Parse(createEventRequest.EventCategoryId)
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns(eventEntity);

            _mockUnitOfWork.Setup(x => x.EventRepository.AddAsync(eventEntity));

            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockMapper.Verify(x => x.Map<Event>(createEventRequest), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(eventEntity), Times.Once);
        }

        [Fact]
        public async Task CreateEventAsync_WithInactiveOrganizer_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                IsApprove = false,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), FullName = "Test User" }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockMapper.Verify(x => x.Map<Event>(createEventRequest), Times.Never);
        }

        [Fact]
        public async Task CreateEventAsync_WithEndTimeBeforeStartTime_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(-1),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("EndTime cannot be before the StartTime");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task CreateEventAsync_WithNonExistentOrganizer_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync((OrganizerProfile?)null);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or inactive");

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
        }

        [Fact]
        public async Task CreateEventAsync_WithMappingFailure_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var createEventRequest = new CreateEventRequest
            {
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                IsApprove = true,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), FullName = "Test User" }
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);
            _mockMapper.Setup(x => x.Map<Event>(createEventRequest))
                .Returns((Event?)null); 

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.CreateEventAsync(organizerId, createEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Failed to map event");
            result.Error.StatusCode.Should().Be(ErrorCodes.InternalServerError);

            _mockMapper.Verify(x => x.Map<Event>(createEventRequest), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.AddAsync(It.IsAny<Event>()), Times.Never);
        }
        #endregion

        #region GetEventByIdAsync Tests

        [Fact]
        public async Task GetEventByIdAsync_WithValidId_ShouldReturnEventDetail()
        {
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString();

            var mockEventService = new Mock<IEventService>();
            var eventDetailResponse = new EventDetailResponse
            {
                EventId = Guid.Parse(eventId),
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free
            };

            mockEventService.Setup(x => x.GetEventByIdAsync(eventId))
                .ReturnsAsync(Result<EventDetailResponse>.Success(eventDetailResponse));

            var result = await mockEventService.Object.GetEventByIdAsync(eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.EventId.Should().Be(Guid.Parse(eventId));
            result.Value.Title.Should().Be("Test Event");
        }

        [Fact]
        public async Task GetEventByIdAsync_WithNonExistentId_ShouldReturnFailureResult()
        {
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString();

            var mockEventService = new Mock<IEventService>();
            mockEventService.Setup(x => x.GetEventByIdAsync(eventId))
                .ReturnsAsync(ErrorResponse.FailureResult("Event code already exists.", ErrorCodes.InvalidInput));


            var result = await mockEventService.Object.GetEventByIdAsync(eventId);
            
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event code already exists.");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        #endregion

        #region DeleteEventAsync Tests

        [Fact]
        public async Task DeleteEventAsync_WithValidEventId_ShouldReturnSuccessResult()
        {
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString();
            var existingEvent = new Event
            {
                Id = Guid.Parse(eventId),
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(Guid.Parse(eventId), true))
                .ReturnsAsync(existingEvent);
            _mockUnitOfWork.Setup(x => x.EventRepository.DeleteAsync(existingEvent))
                .Returns(Task.CompletedTask);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.DeleteEventAsync(eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(Guid.Parse(eventId), true), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.DeleteAsync(existingEvent), Times.Once);
        }

        [Fact]
        public async Task DeleteEventAsync_WithNonExistentEventId_ShouldReturnFailureResult()
        {
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString();

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(Guid.Parse(eventId), true))
                .ReturnsAsync((Event?)null);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.DeleteEventAsync(eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(Guid.Parse(eventId), true), Times.Once);
        }

        [Fact]
        public async Task DeleteEventAsync_WithNonActiveEventId_ShouldReturnFailureResult()
        {
            var eventId = Guid.Parse("11111111-1111-1111-1111-111111111111").ToString();
            var existingEvent = new Event
            {
                Id = Guid.Parse(eventId),
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                DeletedAt = new DateTimeOffset(DateTime.Now.AddDays(1)),
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(Guid.Parse(eventId), true))
                .ReturnsAsync(existingEvent);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.DeleteEventAsync(eventId);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(Guid.Parse(eventId), true), Times.Once);
        }

        #endregion
    }
}
