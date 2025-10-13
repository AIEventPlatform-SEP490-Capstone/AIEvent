using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
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
                RequireApproval = ConfirmStatus.Approve,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
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
                RequireApproval = ConfirmStatus.Approve,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Reject,
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
                RequireApproval = ConfirmStatus.Approve,
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
                RequireApproval = ConfirmStatus.Approve,
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
                RequireApproval = ConfirmStatus.Approve,
                EventCategoryId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").ToString()
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
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
                .Returns((Event?)null!); 

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

        #region UpdateEventAsync Tests

        [Fact]
        public async Task UpdateEventAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var updateEventRequest = new UpdateEventRequest
            {
                Title = "Updated Test Event",
                Description = "Updated Test Description",
                StartTime = DateTime.Now.AddDays(2),
                EndTime = DateTime.Now.AddDays(2).AddHours(3),
                LocationName = "Updated Location",
                City = "Updated City",
                Address = "Updated Address"
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = userId, FullName = "Test User" }
            };

            var user = new AppUser
            {
                Id = userId,
                FullName = "Test User",
                Email = "test@example.com",
                IsActive = true
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Original Event",
                Description = "Original Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                OrganizerProfileId = organizerId,
                ImgListEvent = "[]"
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true))
                .ReturnsAsync(existingEvent);

            _mockMapper.Setup(x => x.Map(updateEventRequest, existingEvent));

            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(existingEvent));

            var result = await _eventService.UpdateEventAsync(organizerId, userId, eventId, updateEventRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once);
            _mockMapper.Verify(x => x.Map(updateEventRequest, existingEvent), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(existingEvent), Times.Once);
        }

        [Fact]
        public async Task UpdateEventAsync_WithInactiveOrganizer_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var updateEventRequest = new UpdateEventRequest
            {
                Title = "Updated Test Event",
                Description = "Updated Test Description",
                StartTime = DateTime.Now.AddDays(2),
                EndTime = DateTime.Now.AddDays(2).AddHours(3)
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Reject,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = userId, FullName = "Test User" }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            var result = await _eventService.UpdateEventAsync(organizerId, userId, eventId, updateEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task UpdateEventAsync_WithEndTimeBeforeStartTime_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var updateEventRequest = new UpdateEventRequest
            {
                Title = "Updated Test Event",
                Description = "Updated Test Description",
                StartTime = DateTime.Now.AddDays(2),
                EndTime = DateTime.Now.AddDays(1) // EndTime before StartTime
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.UpdateEventAsync(organizerId, userId, eventId, updateEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("EndTime cannot be before the StartTime");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UpdateEventAsync_WithNonExistentOrganizer_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var updateEventRequest = new UpdateEventRequest
            {
                Title = "Updated Test Event",
                Description = "Updated Test Description",
                StartTime = DateTime.Now.AddDays(2),
                EndTime = DateTime.Now.AddDays(2).AddHours(3)
            };

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync((OrganizerProfile?)null);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _eventService.UpdateEventAsync(organizerId, userId, eventId, updateEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Organizer not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
        }

        [Fact]
        public async Task UpdateEventAsync_WithNonExistentUser_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var updateEventRequest = new UpdateEventRequest
            {
                Title = "Updated Test Event",
                Description = "Updated Test Description",
                StartTime = DateTime.Now.AddDays(2),
                EndTime = DateTime.Now.AddDays(2).AddHours(3)
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = userId, FullName = "Test User" }
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                .ReturnsAsync((AppUser?)null);

            var result = await _eventService.UpdateEventAsync(organizerId, userId, eventId, updateEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once);
        }

        [Fact]
        public async Task UpdateEventAsync_WithNonExistentEvent_ShouldReturnFailureResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var updateEventRequest = new UpdateEventRequest
            {
                Title = "Updated Test Event",
                Description = "Updated Test Description",
                StartTime = DateTime.Now.AddDays(2),
                EndTime = DateTime.Now.AddDays(2).AddHours(3)
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = userId, FullName = "Test User" }
            };

            var user = new AppUser
            {
                Id = userId,
                FullName = "Test User",
                Email = "test@example.com",
                IsActive = true
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true))
                .ReturnsAsync((Event?)null);

            var result = await _eventService.UpdateEventAsync(organizerId, userId, eventId, updateEventRequest);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found or inactive");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once);
        }

        [Fact]
        public async Task UpdateEventAsync_WithImageUploadAndRemoval_ShouldReturnSuccessResult()
        {
            var organizerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
            var eventId = Guid.Parse("33333333-3333-3333-3333-333333333333");

            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns("test.jpg");
            mockFile.Setup(f => f.Length).Returns(1024);

            var updateEventRequest = new UpdateEventRequest
            {
                Title = "Updated Test Event",
                Description = "Updated Test Description",
                StartTime = DateTime.Now.AddDays(2),
                EndTime = DateTime.Now.AddDays(2).AddHours(3),
                ImgListEvent = new List<IFormFile> { mockFile.Object },
                RemoveImageUrls = new List<string> { "https://old-image.jpg" }
            };

            var organizer = new OrganizerProfile
            {
                Id = organizerId,
                Status = ConfirmStatus.Approve,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                User = new AppUser { Id = userId, FullName = "Test User" }
            };

            var user = new AppUser
            {
                Id = userId,
                FullName = "Test User",
                Email = "test@example.com",
                IsActive = true
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Title = "Original Event",
                Description = "Original Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                OrganizerProfileId = organizerId,
                ImgListEvent = "[\"https://old-image.jpg\", \"https://keep-image.jpg\"]"
            };

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true))
                .ReturnsAsync(organizer);

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true))
                .ReturnsAsync(existingEvent);

            _mockMapper.Setup(x => x.Map(updateEventRequest, existingEvent));

            _mockCloudinaryService.Setup(x => x.DeleteImageAsync("https://old-image.jpg"))
                .Returns(Task.CompletedTask);

            _mockCloudinaryService.Setup(x => x.UploadImageAsync(mockFile.Object))
                .ReturnsAsync("https://new-image.jpg");

            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(existingEvent));

            var result = await _eventService.UpdateEventAsync(organizerId, userId, eventId, updateEventRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockUnitOfWork.Verify(x => x.OrganizerProfileRepository.GetByIdAsync(organizerId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once);
            _mockMapper.Verify(x => x.Map(updateEventRequest, existingEvent), Times.Once);
            _mockCloudinaryService.Verify(x => x.DeleteImageAsync("https://old-image.jpg"), Times.Once);
            _mockCloudinaryService.Verify(x => x.UploadImageAsync(mockFile.Object), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(existingEvent), Times.Once);
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
                RequireApproval = ConfirmStatus.Approve,
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
                RequireApproval = ConfirmStatus.Approve,
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
