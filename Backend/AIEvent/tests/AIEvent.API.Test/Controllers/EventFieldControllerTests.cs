using AIEvent.API.Controllers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTO.Common;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AIEvent.API.Test.Controllers
{
    public class EventFieldControllerTests
    {
        private readonly Mock<IEvenFieldService> _mockEventFieldService;
        private readonly EventFieldController _eventFieldController;

        public EventFieldControllerTests()
        {
            _mockEventFieldService = new Mock<IEvenFieldService>();
            _eventFieldController = new EventFieldController(_mockEventFieldService.Object);
        }

        [Fact]
        public async Task GetEventField_WhenServiceReturnsSuccess_ShouldReturnOkResult()
        {
            // Arrange
            var eventFields = new List<EventFieldResponse>
            {
                new EventFieldResponse { EventFieldId = "1", EventFieldName = "Technology" },
                new EventFieldResponse { EventFieldId = "2", EventFieldName = "Business" }
            };
            var successResult = Result<IEnumerable<EventFieldResponse>>.Success(eventFields);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(successResult);

            // Act
            var result = await _eventFieldController.GetEventField();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetEventField_WhenServiceReturnsSuccess_ShouldReturnSuccessResponse()
        {
            // Arrange
            var eventFields = new List<EventFieldResponse>
            {
                new EventFieldResponse { EventFieldId = "1", EventFieldName = "Technology" },
                new EventFieldResponse { EventFieldId = "2", EventFieldName = "Business" }
            };
            var successResult = Result<IEnumerable<EventFieldResponse>>.Success(eventFields);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(successResult);

            // Act
            var result = await _eventFieldController.GetEventField();
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            okResult!.Value.Should().BeOfType<SuccessResponse<IEnumerable<EventFieldResponse>>>();
            
            var response = okResult.Value as SuccessResponse<IEnumerable<EventFieldResponse>>;
            response.Should().NotBeNull();
            response!.Success.Should().BeTrue();
            response.StatusCode.Should().Be(SuccessCodes.Success);
            response.Message.Should().Be("Event field retrieved successfully");
            response.Data.Should().BeEquivalentTo(eventFields);
        }

        [Fact]
        public async Task GetEventField_WhenServiceReturnsFailure_ShouldReturnBadRequest()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Database error", ErrorCodes.InternalServerError);
            var failureResult = Result<IEnumerable<EventFieldResponse>>.Failure(errorResponse);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(failureResult);

            // Act
            var result = await _eventFieldController.GetEventField();

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task GetEventField_WhenServiceReturnsFailure_ShouldReturnErrorResponse()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Database error", ErrorCodes.InternalServerError);
            var failureResult = Result<IEnumerable<EventFieldResponse>>.Failure(errorResponse);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(failureResult);

            // Act
            var result = await _eventFieldController.GetEventField();
            var badRequestResult = result.Result as BadRequestObjectResult;

            // Assert
            badRequestResult.Should().NotBeNull();
            badRequestResult!.Value.Should().Be(errorResponse);
        }

        [Fact]
        public async Task GetEventField_ShouldCallServiceOnce()
        {
            // Arrange
            var eventFields = new List<EventFieldResponse>
            {
                new EventFieldResponse { EventFieldId = "1", EventFieldName = "Technology" }
            };
            var successResult = Result<IEnumerable<EventFieldResponse>>.Success(eventFields);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(successResult);

            // Act
            await _eventFieldController.GetEventField();

            // Assert
            _mockEventFieldService.Verify(x => x.GetAllEventField(), Times.Once);
        }

        [Fact]
        public async Task GetEventField_WithEmptyResult_ShouldReturnOkWithEmptyList()
        {
            // Arrange
            var emptyEventFields = new List<EventFieldResponse>();
            var successResult = Result<IEnumerable<EventFieldResponse>>.Success(emptyEventFields);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(successResult);

            // Act
            var result = await _eventFieldController.GetEventField();
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            var response = okResult!.Value as SuccessResponse<IEnumerable<EventFieldResponse>>;
            response.Should().NotBeNull();
            response!.Data.Should().BeEmpty();
        }

        [Fact]
        public async Task GetEventField_ShouldReturnHttpStatus200_WhenSuccessful()
        {
            // Arrange
            var eventFields = new List<EventFieldResponse>
            {
                new EventFieldResponse { EventFieldId = "1", EventFieldName = "Technology" }
            };
            var successResult = Result<IEnumerable<EventFieldResponse>>.Success(eventFields);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(successResult);

            // Act
            var result = await _eventFieldController.GetEventField();
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            okResult!.StatusCode.Should().Be(200);
        }

        [Fact]
        public async Task GetEventField_ShouldReturnHttpStatus400_WhenServiceFails()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Service error", ErrorCodes.InternalServerError);
            var failureResult = Result<IEnumerable<EventFieldResponse>>.Failure(errorResponse);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(failureResult);

            // Act
            var result = await _eventFieldController.GetEventField();
            var badRequestResult = result.Result as BadRequestObjectResult;

            // Assert
            badRequestResult.Should().NotBeNull();
            badRequestResult!.StatusCode.Should().Be(400);
        }

        [Fact]
        public async Task GetEventField_WithMultipleEventFields_ShouldReturnAllFields()
        {
            // Arrange
            var eventFields = new List<EventFieldResponse>
            {
                new EventFieldResponse { EventFieldId = "1", EventFieldName = "Technology" },
                new EventFieldResponse { EventFieldId = "2", EventFieldName = "Business" },
                new EventFieldResponse { EventFieldId = "3", EventFieldName = "Healthcare" },
                new EventFieldResponse { EventFieldId = "4", EventFieldName = "Education" }
            };
            var successResult = Result<IEnumerable<EventFieldResponse>>.Success(eventFields);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(successResult);

            // Act
            var result = await _eventFieldController.GetEventField();
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            var response = okResult!.Value as SuccessResponse<IEnumerable<EventFieldResponse>>;
            response.Should().NotBeNull();
            response!.Data.Should().HaveCount(4);
            response.Data.Should().BeEquivalentTo(eventFields);
        }

        [Fact]
        public async Task GetEventField_ResponseStructure_ShouldBeCorrect()
        {
            // Arrange
            var eventFields = new List<EventFieldResponse>
            {
                new EventFieldResponse { EventFieldId = "guid-1", EventFieldName = "Technology" }
            };
            var successResult = Result<IEnumerable<EventFieldResponse>>.Success(eventFields);
            _mockEventFieldService.Setup(x => x.GetAllEventField()).ReturnsAsync(successResult);

            // Act
            var result = await _eventFieldController.GetEventField();
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            var response = okResult!.Value as SuccessResponse<IEnumerable<EventFieldResponse>>;
            response.Should().NotBeNull();
            
            var firstField = response!.Data!.First();
            firstField.EventFieldId.Should().Be("guid-1");
            firstField.EventFieldName.Should().Be("Technology");
        }
    }
}
