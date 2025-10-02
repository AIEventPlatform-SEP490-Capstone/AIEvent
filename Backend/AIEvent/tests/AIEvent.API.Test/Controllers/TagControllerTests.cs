using AIEvent.API.Controllers;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AIEvent.API.Test.Controllers
{
    public class TagControllerTests
    {
        private readonly Mock<ITagService> _mockTagService;
        private readonly TagController _tagController;

        public TagControllerTests()
        {
            _mockTagService = new Mock<ITagService>();
            _tagController = new TagController(_mockTagService.Object);
        }

        #region CreateTag Tests

        [Fact]
        public async Task CreateTag_WithValidRequest_ShouldReturnOkWithSuccessResponse()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = "Technology"
            };

            var serviceResult = Result.Success();
            _mockTagService.Setup(x => x.CreateTagAsync(createTagRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.CreateTag(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<object>>();

            var successResponse = okResult.Value as SuccessResponse<object>;
            successResponse!.StatusCode.Should().Be(SuccessCodes.Created);
            successResponse.Message.Should().Be("Create Tag successfully");

            _mockTagService.Verify(x => x.CreateTagAsync(createTagRequest), Times.Once);
        }

        [Fact]
        public async Task CreateTag_WithExistingTagName_ShouldReturnBadRequest()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = "Technology"
            };

            var errorResponse = ErrorResponse.FailureResult("Tag is already existing", ErrorCodes.InvalidInput);
            var serviceResult = Result.Failure(errorResponse);

            _mockTagService.Setup(x => x.CreateTagAsync(createTagRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.CreateTag(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Tag is already existing");
            errorResponseResult.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockTagService.Verify(x => x.CreateTagAsync(createTagRequest), Times.Once);
        }

        [Fact]
        public async Task CreateTag_WithEmptyTagName_ShouldReturnBadRequest()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = ""
            };

            var errorResponse = ErrorResponse.FailureResult("Tag name cannot be empty", ErrorCodes.InvalidInput);
            var serviceResult = Result.Failure(errorResponse);

            _mockTagService.Setup(x => x.CreateTagAsync(createTagRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.CreateTag(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            var errorResponseResult = badRequestResult!.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Tag name cannot be empty");

            _mockTagService.Verify(x => x.CreateTagAsync(createTagRequest), Times.Once);
        }

        [Fact]
        public async Task CreateTag_WithNullTagName_ShouldReturnBadRequest()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = null!
            };

            var errorResponse = ErrorResponse.FailureResult("Tag name is required", ErrorCodes.InvalidInput);
            var serviceResult = Result.Failure(errorResponse);

            _mockTagService.Setup(x => x.CreateTagAsync(createTagRequest))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.CreateTag(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            _mockTagService.Verify(x => x.CreateTagAsync(createTagRequest), Times.Once);
        }

        #endregion

        #region GetTag Tests

        [Fact]
        public async Task GetTag_WithValidParameters_ShouldReturnOkWithPaginatedTags()
        {
            // Arrange
            var tagResponses = new List<TagResponse>
            {
                new TagResponse { TagId = Guid.NewGuid().ToString(), TagName = "Technology" },
                new TagResponse { TagId = Guid.NewGuid().ToString(), TagName = "Business" },
                new TagResponse { TagId = Guid.NewGuid().ToString(), TagName = "Health" }
            };

            var paginatedResult = new BasePaginated<TagResponse>(tagResponses, 3, 1, 5);
            var serviceResult = Result<BasePaginated<TagResponse>>.Success(paginatedResult);

            _mockTagService.Setup(x => x.GetListTagAsync(1, 5))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.GetTag(1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<SuccessResponse<BasePaginated<TagResponse>>>();

            var successResponse = okResult.Value as SuccessResponse<BasePaginated<TagResponse>>;
            successResponse!.Data!.Items.Should().HaveCount(3);
            successResponse.Data.TotalItems.Should().Be(3);
            successResponse.Message.Should().Be("Tag retrieved successfully");

            _mockTagService.Verify(x => x.GetListTagAsync(1, 5), Times.Once);
        }

        [Fact]
        public async Task GetTag_WithInvalidPageNumber_ShouldReturnBadRequest()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Invalid page number", ErrorCodes.InvalidInput);
            var serviceResult = Result<BasePaginated<TagResponse>>.Failure(errorResponse);

            _mockTagService.Setup(x => x.GetListTagAsync(-1, 5))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.GetTag(-1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            badRequestResult!.Value.Should().BeOfType<ErrorResponse>();

            var errorResponseResult = badRequestResult.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Invalid page number");

            _mockTagService.Verify(x => x.GetListTagAsync(-1, 5), Times.Once);
        }

        [Fact]
        public async Task GetTag_WithInvalidPageSize_ShouldReturnBadRequest()
        {
            // Arrange
            var errorResponse = ErrorResponse.FailureResult("Invalid page size", ErrorCodes.InvalidInput);
            var serviceResult = Result<BasePaginated<TagResponse>>.Failure(errorResponse);

            _mockTagService.Setup(x => x.GetListTagAsync(1, 0))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.GetTag(1, 0);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<BadRequestObjectResult>();

            var badRequestResult = result.Result as BadRequestObjectResult;
            var errorResponseResult = badRequestResult!.Value as ErrorResponse;
            errorResponseResult!.Message.Should().Be("Invalid page size");

            _mockTagService.Verify(x => x.GetListTagAsync(1, 0), Times.Once);
        }

        [Fact]
        public async Task GetTag_WithNoResults_ShouldReturnEmptyPaginatedResult()
        {
            // Arrange
            var emptyResult = new BasePaginated<TagResponse>(new List<TagResponse>(), 0, 1, 5);
            var serviceResult = Result<BasePaginated<TagResponse>>.Success(emptyResult);

            _mockTagService.Setup(x => x.GetListTagAsync(1, 5))
                .ReturnsAsync(serviceResult);

            // Act
            var result = await _tagController.GetTag(1, 5);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();

            var okResult = result.Result as OkObjectResult;
            var successResponse = okResult!.Value as SuccessResponse<BasePaginated<TagResponse>>;
            successResponse!.Data!.Items.Should().BeEmpty();
            successResponse.Data.TotalItems.Should().Be(0);

            _mockTagService.Verify(x => x.GetListTagAsync(1, 5), Times.Once);
        }

        #endregion

        #region Constructor Tests

        [Fact]
        public void Constructor_ShouldInitializeWithTagService()
        {
            // Act
            var controller = new TagController(_mockTagService.Object);

            // Assert
            controller.Should().NotBeNull();
        }

        [Fact]
        public void Constructor_WithNullTagService_ShouldAcceptNull()
        {
            // Act
            var controller = new TagController(null!);

            // Assert
            controller.Should().NotBeNull();
        }

        #endregion
    }
}
