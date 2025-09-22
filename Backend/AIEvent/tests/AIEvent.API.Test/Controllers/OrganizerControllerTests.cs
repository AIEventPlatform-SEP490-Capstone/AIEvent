using AIEvent.API.Controllers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTO.Common;
using AIEvent.Application.DTO.User;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;

namespace AIEvent.API.Test.Controllers
{
    public class OrganizerControllerTests
    {
        private readonly Mock<IOrganizerService> _mockOrganizerService;
        private readonly OrganizerController _organizerController;
        private readonly Guid _testUserId = Guid.NewGuid();

        public OrganizerControllerTests()
        {
            _mockOrganizerService = new Mock<IOrganizerService>();
            _organizerController = new OrganizerController(_mockOrganizerService.Object);
            
            // Setup user context for authorization tests
            SetupUserContext();
        }

        private void SetupUserContext()
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _testUserId.ToString()),
                new Claim(ClaimTypes.Role, "User")
            };
            var identity = new ClaimsIdentity(claims, "Test");
            var principal = new ClaimsPrincipal(identity);
            
            _organizerController.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = principal
                }
            };
        }

        [Fact]
        public async Task GetOrganizer_WhenServiceReturnsSuccess_ShouldReturnOkResult()
        {
            // Arrange
            var organizers = CreateTestOrganizers();
            var successResult = Result<List<OrganizerResponse>>.Success(organizers);
            _mockOrganizerService.Setup(x => x.GetOrganizerAsync(1, 10)).ReturnsAsync(successResult);

            // Act
            var result = await _organizerController.GetOrganizer();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetOrganizer_WhenServiceReturnsSuccess_ShouldReturnSuccessResponse()
        {
            // Arrange
            var organizers = CreateTestOrganizers();
            var successResult = Result<List<OrganizerResponse>>.Success(organizers);
            _mockOrganizerService.Setup(x => x.GetOrganizerAsync(1, 10)).ReturnsAsync(successResult);

            // Act
            var result = await _organizerController.GetOrganizer();
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            okResult!.Value.Should().BeOfType<SuccessResponse<List<OrganizerResponse>>>();
            
            var response = okResult.Value as SuccessResponse<List<OrganizerResponse>>;
            response.Should().NotBeNull();
            response!.Success.Should().BeTrue();
            response.StatusCode.Should().Be(SuccessCodes.Success);
            response.Message.Should().Be("Organizer retrieved successfully");
            response.Data.Should().BeEquivalentTo(organizers);
        }

        [Fact]
        public async Task GetOrganizer_WithCustomPagination_ShouldCallServiceWithCorrectParameters()
        {
            // Arrange
            var organizers = CreateTestOrganizers();
            var successResult = Result<List<OrganizerResponse>>.Success(organizers);
            _mockOrganizerService.Setup(x => x.GetOrganizerAsync(2, 5)).ReturnsAsync(successResult);

            // Act
            await _organizerController.GetOrganizer(2, 5);

            // Assert
            _mockOrganizerService.Verify(x => x.GetOrganizerAsync(2, 5), Times.Once);
        }

        [Fact]
        public async Task GetOrganizer_WhenServiceReturnsFailure_ShouldReturnBadRequest()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Database error", ErrorCodes.InternalServerError);
            var failureResult = Result<List<OrganizerResponse>>.Failure(errorResponse);
            _mockOrganizerService.Setup(x => x.GetOrganizerAsync(1, 10)).ReturnsAsync(failureResult);

            // Act
            var result = await _organizerController.GetOrganizer();

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task GetOrganizerById_WhenServiceReturnsSuccess_ShouldReturnOkResult()
        {
            // Arrange
            var organizerId = Guid.NewGuid().ToString();
            var organizer = CreateTestOrganizer();
            var successResult = Result<OrganizerResponse>.Success(organizer);
            _mockOrganizerService.Setup(x => x.GetOrganizerByIdAsync(organizerId)).ReturnsAsync(successResult);

            // Act
            var result = await _organizerController.GetOrganizerById(organizerId);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetOrganizerById_WhenServiceReturnsSuccess_ShouldReturnSuccessResponse()
        {
            // Arrange
            var organizerId = Guid.NewGuid().ToString();
            var organizer = CreateTestOrganizer();
            var successResult = Result<OrganizerResponse>.Success(organizer);
            _mockOrganizerService.Setup(x => x.GetOrganizerByIdAsync(organizerId)).ReturnsAsync(successResult);

            // Act
            var result = await _organizerController.GetOrganizerById(organizerId);
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            var response = okResult!.Value as SuccessResponse<OrganizerResponse>;
            response.Should().NotBeNull();
            response!.Success.Should().BeTrue();
            response.Data.Should().BeEquivalentTo(organizer);
        }

        [Fact]
        public async Task GetOrganizerById_WhenServiceReturnsFailure_ShouldReturnBadRequest()
        {
            // Arrange
            var organizerId = Guid.NewGuid().ToString();
            var errorResponse = ErrorResponse.FailureResult("Organizer not found", ErrorCodes.NotFound);
            var failureResult = Result<OrganizerResponse>.Failure(errorResponse);
            _mockOrganizerService.Setup(x => x.GetOrganizerByIdAsync(organizerId)).ReturnsAsync(failureResult);

            // Act
            var result = await _organizerController.GetOrganizerById(organizerId);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task RegisterOrganizer_WhenServiceReturnsSuccess_ShouldReturnOkResult()
        {
            // Arrange
            var request = CreateTestRegisterRequest();
            var successResult = Result.Success();
            _mockOrganizerService.Setup(x => x.RegisterOrganizerAsync(_testUserId, request)).ReturnsAsync(successResult);

            // Act
            var result = await _organizerController.RegisterOrganizer(request);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task RegisterOrganizer_WhenServiceReturnsSuccess_ShouldReturnSuccessResponse()
        {
            // Arrange
            var request = CreateTestRegisterRequest();
            var successResult = Result.Success();
            _mockOrganizerService.Setup(x => x.RegisterOrganizerAsync(_testUserId, request)).ReturnsAsync(successResult);

            // Act
            var result = await _organizerController.RegisterOrganizer(request);
            var okResult = result.Result as OkObjectResult;

            // Assert
            okResult.Should().NotBeNull();
            var response = okResult!.Value as SuccessResponse<object>;
            response.Should().NotBeNull();
            response!.Success.Should().BeTrue();
            response.StatusCode.Should().Be(SuccessCodes.Created);
            response.Message.Should().Be("Register Organizer successfully");

            // Verify service was called with correct parameters
            _mockOrganizerService.Verify(x => x.RegisterOrganizerAsync(_testUserId, request), Times.Once);
        }

        [Fact]
        public async Task RegisterOrganizer_WhenServiceReturnsFailure_ShouldReturnBadRequest()
        {
            // Arrange
            var request = CreateTestRegisterRequest();
            var errorResponse = ErrorResponse.FailureResult("Registration failed", ErrorCodes.InvalidInput);
            var failureResult = Result.Failure(errorResponse);
            _mockOrganizerService.Setup(x => x.RegisterOrganizerAsync(_testUserId, request)).ReturnsAsync(failureResult);

            // Act
            var result = await _organizerController.RegisterOrganizer(request);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task RegisterOrganizer_ShouldCallServiceWithCorrectUserId()
        {
            // Arrange
            var request = CreateTestRegisterRequest();
            var successResult = Result.Success();
            _mockOrganizerService.Setup(x => x.RegisterOrganizerAsync(_testUserId, request)).ReturnsAsync(successResult);

            // Act
            await _organizerController.RegisterOrganizer(request);

            // Assert
            _mockOrganizerService.Verify(x => x.RegisterOrganizerAsync(_testUserId, request), Times.Once);
        }

        [Fact]
        public async Task RegisterOrganizer_WhenServiceReturnsUnauthorizedFailure_ShouldReturnBadRequest()
        {
            // Arrange
            var request = CreateTestRegisterRequest();
            var errorResponse = ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
            var failureResult = Result.Failure(errorResponse);
            _mockOrganizerService.Setup(x => x.RegisterOrganizerAsync(_testUserId, request)).ReturnsAsync(failureResult);

            // Act
            var result = await _organizerController.RegisterOrganizer(request);
            var badRequestResult = result.Result as BadRequestObjectResult;

            // Assert
            badRequestResult.Should().NotBeNull();
            var response = badRequestResult!.Value as ErrorResponse;
            response.Should().NotBeNull();
            response!.Success.Should().BeFalse();
            response.Message.Should().Be("User not found or inactive");
            response.StatusCode.Should().Be(ErrorCodes.Unauthorized);

            // Verify service was called
            _mockOrganizerService.Verify(x => x.RegisterOrganizerAsync(_testUserId, request), Times.Once);
        }

        [Fact]
        public async Task RegisterOrganizer_WithValidData_ShouldExtractUserIdFromClaims()
        {
            // Arrange
            var request = CreateTestRegisterRequest();
            var successResult = Result.Success();
            _mockOrganizerService.Setup(x => x.RegisterOrganizerAsync(It.IsAny<Guid>(), request)).ReturnsAsync(successResult);

            // Act
            var result = await _organizerController.RegisterOrganizer(request);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            // Verify that the service was called with the user ID from claims
            _mockOrganizerService.Verify(x => x.RegisterOrganizerAsync(_testUserId, request), Times.Once);
        }

        private List<OrganizerResponse> CreateTestOrganizers()
        {
            return new List<OrganizerResponse>
            {
                CreateTestOrganizer(),
                new OrganizerResponse
                {
                    OrganizerId = Guid.NewGuid(),
                    OrganizationType = OrganizationType.NonProfit,
                    EventFrequency = EventFrequency.Quarterly,
                    EventSize = EventSize.Large,
                    OrganizerType = OrganizerType.Business,
                    EventExperienceLevel = EventExperienceLevel.Expert,
                    ContactName = "Jane Smith",
                    ContactEmail = "jane@example.com",
                    ContactPhone = "0987654321",
                    Address = "456 Business St, City",
                    UserInfo = new UserOrganizerResponse
                    {
                        Email = "jane@example.com",
                        FullName = "Jane Smith",
                        PhoneNumber = "0987654321"
                    }
                }
            };
        }

        private OrganizerResponse CreateTestOrganizer()
        {
            return new OrganizerResponse
            {
                OrganizerId = Guid.NewGuid(),
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "John Doe",
                ContactEmail = "john@example.com",
                ContactPhone = "0123456789",
                Address = "123 Main St, City",
                UserInfo = new UserOrganizerResponse
                {
                    Email = "john@example.com",
                    FullName = "John Doe",
                    PhoneNumber = "0123456789"
                }
            };
        }

        private RegisterOrganizerRequest CreateTestRegisterRequest()
        {
            return new RegisterOrganizerRequest
            {
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Organizer",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "123 Test St, Test City",
                OrganizerFields = new List<OrganizerFieldRequest>
                {
                    new OrganizerFieldRequest { OrganizerFieldId = Guid.NewGuid().ToString() },
                    new OrganizerFieldRequest { OrganizerFieldId = Guid.NewGuid().ToString() },
                    new OrganizerFieldRequest { OrganizerFieldId = Guid.NewGuid().ToString() }
                }
            };
        }
    }
}
