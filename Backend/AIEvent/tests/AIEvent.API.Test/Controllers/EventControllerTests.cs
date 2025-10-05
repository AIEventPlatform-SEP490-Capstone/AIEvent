using AIEvent.API.Controllers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace AIEvent.API.Test.Controllers
{
    public class EventControllerTests
    {
        private readonly Mock<IEventService> _mockEventService;
        private readonly EventController _eventController;

        public EventControllerTests()
        {
            _mockEventService = new Mock<IEventService>();
            _eventController = new EventController(_mockEventService.Object);
        }

        #region GetEventById Tests

        [Fact]
        public async Task GetEventById_WithValidId_ShouldReturnOkWithEventDetail()
        {
            // Arrange
            var eventId = Guid.NewGuid().ToString();
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

            var serviceResult = Result<EventDetailResponse>.Success(eventDetailResponse);
            _mockEventService.Setup(x => x.GetEventByIdAsync(eventId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.GetEventById(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<EventDetailResponse>>();

            var successResponse = okResult.Value as SuccessResponse<EventDetailResponse>;
            successResponse!.Data!.EventId.Should().Be(Guid.Parse(eventId));
            successResponse.Data.Title.Should().Be("Test Event");
            successResponse.Message.Should().Be("Event retrieved successfully");

            _mockEventService.Verify(x => x.GetEventByIdAsync(eventId), Times.Once);
        }

        [Fact]
        public async Task GetEventById_WithInvalidId_ShouldReturnBadRequest()
        {
            // Arrange
            var eventId = "invalid-id";
            var errorResponse = ErrorResponse.FailureResult("Event not found", ErrorCodes.InvalidInput);
            var serviceResult = Result<EventDetailResponse>.Failure(errorResponse);

            _mockEventService.Setup(x => x.GetEventByIdAsync(eventId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.GetEventById(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Event not found");

            _mockEventService.Verify(x => x.GetEventByIdAsync(eventId), Times.Once);
        }

        [Fact]
        public async Task GetEventById_WithNonExistentId_ShouldReturnBadRequest()
        {
            // Arrange
            var eventId = Guid.NewGuid().ToString();
            var errorResponse = ErrorResponse.FailureResult("Event code already exists.", ErrorCodes.InvalidInput);
            var serviceResult = Result<EventDetailResponse>.Failure(errorResponse);

            _mockEventService.Setup(x => x.GetEventByIdAsync(eventId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.GetEventById(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            _mockEventService.Verify(x => x.GetEventByIdAsync(eventId), Times.Once);
        }

        #endregion

        #region GetEvent Tests

        [Fact]
        public async Task GetEvent_WithValidParameters_ShouldReturnOkWithPaginatedEvents()
        {
            // Arrange
            var eventsResponse = new List<EventsResponse>
            {
                new EventsResponse
                {
                    EventId = Guid.NewGuid(),
                    EventCategoryName = "Technology",
                    Title = "Tech Conference",
                    Description = "Annual tech conference",
                    StartTime = DateTime.Now.AddDays(1),
                    EndTime = DateTime.Now.AddDays(1).AddHours(8),
                    TotalTickets = 500,
                    SoldQuantity = 100,
                    TicketType = TicketType.Paid
                }
            };

            var paginatedResult = new BasePaginated<EventsResponse>(eventsResponse, 1, 1, 5);
            var serviceResult = Result<BasePaginated<EventsResponse>>.Success(paginatedResult);

            _mockEventService.Setup(x => x.GetEventAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<EventTagRequest>?>() ,It.IsAny<TicketType?>(), 
                It.IsAny<string>(), It.IsAny<TimeLine?>(), It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.GetEvent("tech", null, null,TicketType.Paid, "Ho Chi Minh", TimeLine.ThisWeek, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<BasePaginated<EventsResponse>>>();

            var successResponse = okResult.Value as SuccessResponse<BasePaginated<EventsResponse>>;
            successResponse!.Data!.Items.Should().HaveCount(1);
            successResponse.Message.Should().Be("Event retrieved successfully");

            _mockEventService.Verify(x => x.GetEventAsync("tech", null,null, TicketType.Paid, "Ho Chi Minh", TimeLine.ThisWeek, 1, 5), Times.Once);
        }

        [Fact]
        public async Task GetEvent_WithInvalidParameters_ShouldReturnBadRequest()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Invalid search parameters", ErrorCodes.InvalidInput);
            var serviceResult = Result<BasePaginated<EventsResponse>>.Failure(errorResponse);

            _mockEventService.Setup(x => x.GetEventAsync(
                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<EventTagRequest>?>(), It.IsAny<TicketType?>(),
                It.IsAny<string>(), It.IsAny<TimeLine?>(), It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.GetEvent("", "", null,null, "", null, -1, 0);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            _mockEventService.Verify(x => x.GetEventAsync("", "", null, null, "", null, -1, 0), Times.Once);
        }

        [Fact]
        public async Task GetEvent_WithNoResults_ShouldReturnEmptyPaginatedResult()
        {
            // Arrange
            var emptyResult = new BasePaginated<EventsResponse>(new List<EventsResponse>(), 0, 1, 5);
            var serviceResult = Result<BasePaginated<EventsResponse>>.Success(emptyResult);

            _mockEventService.Setup(x => x.GetEventAsync(
                 It.IsAny<string>(), It.IsAny<string>(), It.IsAny<List<EventTagRequest>?>(), It.IsAny<TicketType?>(),
                It.IsAny<string>(), It.IsAny<TimeLine?>(), It.IsAny<int>(), It.IsAny<int>()))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.GetEvent("nonexistent", null, null, null, null, TimeLine.ThisMonth, 1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            var successResponse = okResult!.Value as SuccessResponse<BasePaginated<EventsResponse>>;
            successResponse!.Data!.Items.Should().BeEmpty();
            successResponse.Data.TotalItems.Should().Be(0);

            _mockEventService.Verify(x => x.GetEventAsync("nonexistent", null, null, null, null, TimeLine.ThisMonth,1, 5), Times.Once);
        }

        #endregion

        #region CreateEvent Tests

        [Fact]
        public async Task CreateEvent_WithValidRequest_ShouldReturnOkWithSuccessResponse()
        {
            // Arrange
            var organizerId = Guid.NewGuid();
            var createEventRequest = new CreateEventRequest
            {
                Title = "New Event",
                Description = "Event Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.NewGuid().ToString()
            };

            var serviceResult = Result.Success();
            _mockEventService.Setup(x => x.CreateEventAsync(It.IsAny<Guid>(), createEventRequest))
                .ReturnsAsync(serviceResult);

            // Setup user claims for organizer ID
            var claims = new List<Claim>
            {
                new Claim("organizer", organizerId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);

            _eventController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            // Act
            var result = await _eventController.CreateEvent(createEventRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<object>>();

            var successResponse = okResult.Value as SuccessResponse<object>;
            successResponse!.StatusCode.Should().Be(SuccessCodes.Created);
            successResponse.Message.Should().Be("Register Event successfully");

            _mockEventService.Verify(x => x.CreateEventAsync(It.IsAny<Guid>(), createEventRequest), Times.Once);
        }

        [Fact]
        public async Task CreateEvent_WithInvalidOrganizer_ShouldReturnBadRequest()
        {
            // Arrange
            var createEventRequest = new CreateEventRequest
            {
                Title = "New Event",
                Description = "Event Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.NewGuid().ToString()
            };

            var errorResponse = ErrorResponse.FailureResult("Organizer not found or inactive", ErrorCodes.Unauthorized);
            var serviceResult = Result.Failure(errorResponse);

            _mockEventService.Setup(x => x.CreateEventAsync(It.IsAny<Guid>(), createEventRequest))
                .ReturnsAsync(serviceResult);

            // Setup user claims for organizer ID
            var organizerId = Guid.NewGuid();
            var claims = new List<Claim>
            {
                new Claim("organizer", organizerId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);

            _eventController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            // Act
            var result = await _eventController.CreateEvent(createEventRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Organizer not found or inactive");

            _mockEventService.Verify(x => x.CreateEventAsync(It.IsAny<Guid>(), createEventRequest), Times.Once);
        }

        [Fact]
        public async Task CreateEvent_WithMappingFailure_ShouldReturnBadRequest()
        {
            // Arrange
            var createEventRequest = new CreateEventRequest
            {
                Title = "New Event",
                Description = "Event Description",
                StartTime = DateTime.Now.AddDays(1),
                EndTime = DateTime.Now.AddDays(1).AddHours(2),
                TotalTickets = 100,
                TicketType = TicketType.Free,
                RequireApproval = true,
                EventCategoryId = Guid.NewGuid().ToString()
            };

            var errorResponse = ErrorResponse.FailureResult("Failed to map event", ErrorCodes.InternalServerError);
            var serviceResult = Result.Failure(errorResponse);

            _mockEventService.Setup(x => x.CreateEventAsync(It.IsAny<Guid>(), createEventRequest))
                .ReturnsAsync(serviceResult);

            // Setup user claims for organizer ID
            var organizerId = Guid.NewGuid();
            var claims = new List<Claim>
            {
                new Claim("organizer", organizerId.ToString())
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);

            _eventController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            // Act
            var result = await _eventController.CreateEvent(createEventRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            var errorResponseResult = badRequestResult!.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Failed to map event");

            _mockEventService.Verify(x => x.CreateEventAsync(It.IsAny<Guid>(), createEventRequest), Times.Once);
        }

        #endregion

        #region DeleteEvent Tests

        [Fact]
        public async Task DeleteEvent_WithValidEventId_ShouldReturnOkWithSuccessResponse()
        {
            // Arrange
            var eventId = Guid.NewGuid().ToString();
            var serviceResult = Result.Success();

            _mockEventService.Setup(x => x.DeleteEventAsync(eventId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.DeleteEvent(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<object>>();

            var successResponse = okResult.Value as SuccessResponse<object>;
            successResponse!.StatusCode.Should().Be(SuccessCodes.Success);
            successResponse.Message.Should().Be("Delete Event successfully");

            _mockEventService.Verify(x => x.DeleteEventAsync(eventId), Times.Once);
        }

        [Fact]
        public async Task DeleteEvent_WithNonExistentEventId_ShouldReturnBadRequest()
        {
            // Arrange
            var eventId = Guid.NewGuid().ToString();
            var errorResponse = ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.InvalidInput);
            var serviceResult = Result.Failure(errorResponse);

            _mockEventService.Setup(x => x.DeleteEventAsync(eventId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.DeleteEvent(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Event not found or inactive");

            _mockEventService.Verify(x => x.DeleteEventAsync(eventId), Times.Once);
        }

        [Fact]
        public async Task DeleteEvent_WithInvalidEventId_ShouldReturnBadRequest()
        {
            // Arrange
            var eventId = "invalid-guid";
            var errorResponse = ErrorResponse.FailureResult("Invalid event ID format", ErrorCodes.InvalidInput);
            var serviceResult = Result.Failure(errorResponse);

            _mockEventService.Setup(x => x.DeleteEventAsync(eventId))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _eventController.DeleteEvent(eventId);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            _mockEventService.Verify(x => x.DeleteEventAsync(eventId), Times.Once);
        }

        #endregion
    }
}
