using AIEvent.API.Controllers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Enums;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AIEvent.API.Test.Controllers
{
    public class EnumControllerTests
    {
        private readonly EnumController _enumController;
        private readonly Mock<IEnumService> _mockEnumService;

        public EnumControllerTests()
        {
            _mockEnumService = new Mock<IEnumService>();

            // Setup mock to return actual enum values for all enums used in the controller
            _mockEnumService.Setup(x => x.GetEnumValues<BudgetOption>())
                .Returns(GetActualEnumValues<BudgetOption>());
            _mockEnumService.Setup(x => x.GetEnumValues<EventExperienceLevel>())
                .Returns(GetActualEnumValues<EventExperienceLevel>());
            _mockEnumService.Setup(x => x.GetEnumValues<EventFrequency>())
                .Returns(GetActualEnumValues<EventFrequency>());
            _mockEnumService.Setup(x => x.GetEnumValues<EventSize>())
                .Returns(GetActualEnumValues<EventSize>());
            _mockEnumService.Setup(x => x.GetEnumValues<OrganizationType>())
                .Returns(GetActualEnumValues<OrganizationType>());
            _mockEnumService.Setup(x => x.GetEnumValues<OrganizerType>())
                .Returns(GetActualEnumValues<OrganizerType>());
            _mockEnumService.Setup(x => x.GetEnumValues<ParticipationFrequency>())
                .Returns(GetActualEnumValues<ParticipationFrequency>());
            _mockEnumService.Setup(x => x.GetEnumValues<TicketType>())
                .Returns(GetActualEnumValues<TicketType>());

            _enumController = new EnumController(_mockEnumService.Object);
        }

        private IEnumerable<object> GetActualEnumValues<T>() where T : Enum
        {
            return Enum.GetValues(typeof(T))
                       .Cast<T>()
                       .Select(e => new
                       {
                           Value = Convert.ToInt32(e),
                           Name = e.ToString(),
                           Description = e.ToString()
                       });
        }

        [Fact]
        public void GetAllEnums_ShouldReturnOkResult()
        {
            // Act
            var result = _enumController.GetAllEnums();

            // Assert
            result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public void GetAllEnums_ShouldReturnSuccessResponse()
        {
            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.Value.Should().BeOfType<SuccessResponse<object>>();
            
            var response = result.Value as SuccessResponse<object>;
            response.Should().NotBeNull();
            response!.Success.Should().BeTrue();
            response.StatusCode.Should().Be(SuccessCodes.Success);
            response.Message.Should().Be("Retrieved successfully");
        }

        [Fact]
        public void GetAllEnums_ShouldReturnAllEnumTypes()
        {
            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;
            var response = result!.Value as SuccessResponse<object>;

            // Assert
            response.Should().NotBeNull();
            response!.Data.Should().NotBeNull();

            // Use reflection to check the anonymous object properties
            var data = response.Data;
            var dataType = data!.GetType();

            dataType.GetProperty("BudgetOption").Should().NotBeNull();
            dataType.GetProperty("EventExperienceLevel").Should().NotBeNull();
            dataType.GetProperty("EventFrequency").Should().NotBeNull();
            dataType.GetProperty("EventSize").Should().NotBeNull();
            dataType.GetProperty("OrganizationType").Should().NotBeNull();
            dataType.GetProperty("OrganizerType").Should().NotBeNull();
            dataType.GetProperty("ParticipationFrequency").Should().NotBeNull();
            dataType.GetProperty("TicketType").Should().NotBeNull();
        }

        [Fact]
        public void GetAllEnums_ShouldReturnValidEnumValues()
        {
            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;
            var response = result!.Value as SuccessResponse<object>;
            var data = response!.Data;

            // Assert
            var dataType = data!.GetType();
            var budgetOption = dataType.GetProperty("BudgetOption")!.GetValue(data);
            var eventExperienceLevel = dataType.GetProperty("EventExperienceLevel")!.GetValue(data);
            var eventFrequency = dataType.GetProperty("EventFrequency")!.GetValue(data);
            var eventSize = dataType.GetProperty("EventSize")!.GetValue(data);
            var organizationType = dataType.GetProperty("OrganizationType")!.GetValue(data);
            var organizerType = dataType.GetProperty("OrganizerType")!.GetValue(data);
            var participationFrequency = dataType.GetProperty("ParticipationFrequency")!.GetValue(data);
            var ticketType = dataType.GetProperty("TicketType")!.GetValue(data);

            budgetOption.Should().NotBeNull();
            eventExperienceLevel.Should().NotBeNull();
            eventFrequency.Should().NotBeNull();
            eventSize.Should().NotBeNull();
            organizationType.Should().NotBeNull();
            organizerType.Should().NotBeNull();
            participationFrequency.Should().NotBeNull();
            ticketType.Should().NotBeNull();
        }

        [Fact]
        public void GetAllEnums_EventExperienceLevel_ShouldContainExpectedValues()
        {
            // Arrange
            var expectedValues = GetActualEnumValues<EventExperienceLevel>();

            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;
            var response = result!.Value as SuccessResponse<object>;
            var data = response!.Data;
            var dataType = data!.GetType();
            var actualValues = dataType.GetProperty("EventExperienceLevel")!.GetValue(data);

            // Assert
            actualValues.Should().BeEquivalentTo(expectedValues);
        }

        [Fact]
        public void GetAllEnums_EventFrequency_ShouldContainExpectedValues()
        {
            // Arrange
            var expectedValues = GetActualEnumValues<EventFrequency>();

            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;
            var response = result!.Value as SuccessResponse<object>;
            var data = response!.Data;
            var dataType = data!.GetType();
            var actualValues = dataType.GetProperty("EventFrequency")!.GetValue(data);

            // Assert
            actualValues.Should().BeEquivalentTo(expectedValues);
        }

        [Fact]
        public void GetAllEnums_EventSize_ShouldContainExpectedValues()
        {
            // Arrange
            var expectedValues = GetActualEnumValues<EventSize>();

            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;
            var response = result!.Value as SuccessResponse<object>;
            var data = response!.Data;
            var dataType = data!.GetType();
            var actualValues = dataType.GetProperty("EventSize")!.GetValue(data);

            // Assert
            actualValues.Should().BeEquivalentTo(expectedValues);
        }

        [Fact]
        public void GetAllEnums_OrganizationType_ShouldContainExpectedValues()
        {
            // Arrange
            var expectedValues = GetActualEnumValues<OrganizationType>();

            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;
            var response = result!.Value as SuccessResponse<object>;
            var data = response!.Data;
            var dataType = data!.GetType();
            var actualValues = dataType.GetProperty("OrganizationType")!.GetValue(data);

            // Assert
            actualValues.Should().BeEquivalentTo(expectedValues);
        }

        [Fact]
        public void GetAllEnums_ShouldReturnHttpStatus200()
        {
            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;

            // Assert
            result.Should().NotBeNull();
            result!.StatusCode.Should().Be(200);
        }

        [Fact]
        public void GetAllEnums_ResponseData_ShouldNotBeEmpty()
        {
            // Act
            var result = _enumController.GetAllEnums() as OkObjectResult;
            var response = result!.Value as SuccessResponse<object>;

            // Assert
            response.Should().NotBeNull();
            response!.Data.Should().NotBeNull();
            
            var data = response.Data;
            var dataType = data!.GetType();
            var properties = dataType.GetProperties();
            
            properties.Should().HaveCount(8); // Should have 8 enum properties
            
            foreach (var property in properties)
            {
                var value = property.GetValue(data);
                value.Should().NotBeNull();
            }
        }
    }
}
