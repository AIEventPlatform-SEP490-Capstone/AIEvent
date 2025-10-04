using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.EventCategory;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;


namespace AIEvent.Application.Test.Services
{
    public class EventCategoryServiceTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<ITransactionHelper> _transactionHelperMock;
        private readonly Mock<IGenericRepository<EventCategory>> _categoryRepoMock;
        private readonly EventCategoryService _eventCategoryService;

        private static readonly Guid TestCategoryId = Guid.Parse("a3f4a95e-27fb-4d32-b2c1-1f4a5c6e8d9b");

        public EventCategoryServiceTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _transactionHelperMock = new Mock<ITransactionHelper>();
            _categoryRepoMock = new Mock<IGenericRepository<EventCategory>>();

            _unitOfWorkMock.Setup(u => u.EventCategoryRepository).Returns(_categoryRepoMock.Object);
            _eventCategoryService = new EventCategoryService(_unitOfWorkMock.Object, _transactionHelperMock.Object);
        }


        // ---------- CreateEventCategoryAsync ----------

        [Fact]
        public async Task CreateEventCategoryAsync_ShouldReturnSuccess_WhenCategoryDoesNotExist()
        {
            // Arrange
            var request = new CreateCategoryRequest 
            { 
                EventCategoryName = "Technology" 
            };

            var categories = new List<EventCategory>().AsQueryable().BuildMock();
            _categoryRepoMock.Setup(r => r.Query(It.IsAny<bool>())).Returns(categories);

            _categoryRepoMock.Setup(r => r.AddAsync(It.IsAny<EventCategory>()))
                .ReturnsAsync((EventCategory c) => c);

            _transactionHelperMock.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _eventCategoryService.CreateEventCategoryAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            _categoryRepoMock.Verify(r => r.AddAsync(It.Is<EventCategory>(c => c.CategoryName == "Technology")), Times.Once);
        }

        [Fact]
        public async Task CreateEventCategoryAsync_ShouldReturnFailure_WhenCategoryAlreadyExists()
        {
            // Arrange
            var request = new CreateCategoryRequest 
            { 
                EventCategoryName = "Technology" 
            };

            var existing = new List<EventCategory>
        {
            new EventCategory 
            { 
                Id = Guid.NewGuid(), 
                CategoryName = "Technology" }
            }
            .AsQueryable().BuildMock();

            _categoryRepoMock.Setup(r => r.Query(It.IsAny<bool>())).Returns(existing);

            _transactionHelperMock.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _eventCategoryService.CreateEventCategoryAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Message.Should().Be("EventCateogry is already existing");
            _categoryRepoMock.Verify(r => r.AddAsync(It.IsAny<EventCategory>()), Times.Never);
        }

        [Fact]
        public async Task CreateEventCategoryAsync_ShouldReturnFailure_WhenCategoryNameIsEmpty()
        {
            // Arrange
            var request = new CreateCategoryRequest 
            { 
                EventCategoryName = "" 
            };

            var emptyCategories = new List<EventCategory>().AsQueryable().BuildMock();

            var categoryRepoMock = new Mock<IGenericRepository<EventCategory>>();
            categoryRepoMock.Setup(r => r.Query(It.IsAny<bool>())).Returns(emptyCategories);

            _unitOfWorkMock.Setup(u => u.EventCategoryRepository).Returns(categoryRepoMock.Object);

            _transactionHelperMock.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _eventCategoryService.CreateEventCategoryAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error.Message.Should().Be("Event category name is required");

            categoryRepoMock.Verify(r => r.AddAsync(It.IsAny<EventCategory>()), Times.Never);
        }


        // ---------- DeleteEventCategoryAsync ----------

        [Fact]
        public async Task DeleteEventCategoryAsync_ShouldReturnFailure_WhenCategoryNotFound()
        {
            // Arrange
            var emptyCategories = new List<EventCategory>().AsQueryable().BuildMock();

            _categoryRepoMock.Setup(r => r.Query(It.IsAny<bool>())).Returns(emptyCategories);

            _transactionHelperMock.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _eventCategoryService.DeleteEventCategoryAsync(TestCategoryId.ToString());

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error.Message.Should().Be("Can not found or EventCategory is deleted");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _categoryRepoMock.Verify(r => r.DeleteAsync(It.IsAny<EventCategory>()), Times.Never);
        }

        [Fact]
        public async Task DeleteEventCategoryAsync_ShouldReturnFailure_WhenCategoryAlreadyDeleted()
        {
            // Arrange
            var category = new EventCategory
            {
                Id = TestCategoryId,
                CategoryName = "Tech",
                DeletedAt = new DateTime(2025, 10, 04, 21, 41, 00, DateTimeKind.Utc)
        };
            var categories = new List<EventCategory> { category }.AsQueryable().BuildMock();

            _categoryRepoMock.Setup(r => r.Query(It.IsAny<bool>())).Returns(categories);

            _transactionHelperMock.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _eventCategoryService.DeleteEventCategoryAsync(TestCategoryId.ToString());

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error.Message.Should().Be("Can not found or EventCategory is deleted");

            _categoryRepoMock.Verify(r => r.DeleteAsync(It.IsAny<EventCategory>()), Times.Never);
        }

        [Fact]
        public async Task DeleteEventCategoryAsync_ShouldReturnSuccess_WhenCategoryExists()
        {
            // Arrange
            var category = new EventCategory
            {
                Id = TestCategoryId,
                CategoryName = "Tech",
            };
            var categories = new List<EventCategory> { category }.AsQueryable().BuildMock();

            _categoryRepoMock.Setup(r => r.Query(It.IsAny<bool>())).Returns(categories);
            _categoryRepoMock.Setup(r => r.DeleteAsync(It.IsAny<EventCategory>()))
                             .Returns(Task.CompletedTask);

            _transactionHelperMock.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _eventCategoryService.DeleteEventCategoryAsync(TestCategoryId.ToString());

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _categoryRepoMock.Verify(r => r.DeleteAsync(It.Is<EventCategory>(c => c.Id == TestCategoryId)), Times.Once);
        }

        [Fact]
        public async Task DeleteEventCategoryAsync_ShouldReturnFailure_WhenInvalidGuid()
        {
            // Arrange
            var invalidId = "not-a-guid";

            _transactionHelperMock.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _eventCategoryService.DeleteEventCategoryAsync(invalidId);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            Assert.Contains("Invalid Guid format", result.Error.Message, StringComparison.OrdinalIgnoreCase);

            _categoryRepoMock.Verify(r => r.DeleteAsync(It.IsAny<EventCategory>()), Times.Never);
        }


        //-------------GetEventCategoryByIdAsync-----------------------------

        [Fact]
        public async Task GetEventCategoryByIdAsync_ShouldReturnSuccess_WhenCategoryExists()
        {
            // Arrange
            var category = new EventCategory
            {
                Id = TestCategoryId,
                CategoryName = "Music",
            };

            var mockData = new List<EventCategory> { category }.AsQueryable().BuildMock();
            _categoryRepoMock.Setup(r => r.Query(false)).Returns(mockData);

            // Act
            var result = await _eventCategoryService.GetEventCategoryByIdAsync(TestCategoryId.ToString());

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal(TestCategoryId.ToString(), result.Value.EventCategoryId);
            Assert.Equal("Music", result.Value.EventCategoryName);
        }

        [Fact]
        public async Task GetEventCategoryByIdAsync_ShouldReturnFailure_WhenCategoryNotFound()
        {
            // Arrange
            var id = Guid.Parse("c9e0f1a2-5b34-4d87-bf8a-7e5f2e0a4c12");
            var mockData = new List<EventCategory>().AsQueryable().BuildMock();
            _categoryRepoMock.Setup(r => r.Query(false)).Returns(mockData);

            // Act
            var result = await _eventCategoryService.GetEventCategoryByIdAsync(id.ToString());

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
            Assert.Contains("Can not found", result.Error.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task GetEventCategoryByIdAsync_ShouldReturnFailure_WhenCategoryIsDeleted()
        {
            // Arrange
            var category = new EventCategory
            {
                Id = TestCategoryId,
                CategoryName = "Old Category",
                DeletedAt = new DateTime(2025, 10, 04, 21, 41, 00, DateTimeKind.Utc)
            };

            var mockData = new List<EventCategory> { category }.AsQueryable().BuildMock();
            _categoryRepoMock.Setup(r => r.Query(false)).Returns(mockData);

            // Act
            var result = await _eventCategoryService.GetEventCategoryByIdAsync(TestCategoryId.ToString());

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
            Assert.Contains("deleted", result.Error.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task GetEventCategoryByIdAsync_ShouldReturnFailure_WhenInvalidGuid()
        {
            // Arrange
            var invalidId = "not-a-guid";

            // Act
            Result<EventCategoryResponse> result;
            try
            {
                result = await _eventCategoryService.GetEventCategoryByIdAsync(invalidId);
            }
            catch (FormatException ex)
            {
                Assert.Contains("Guid", ex.Message, StringComparison.OrdinalIgnoreCase);
                return;
            }

            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InternalServerError, result.Error.StatusCode);
            Assert.Contains("Guid", result.Error.Message, StringComparison.OrdinalIgnoreCase);
        }

        //---------------UpdateEventCategoryAsync-----------------------------

        [Fact]
        public async Task UpdateEventCategoryAsync_ShouldReturnSuccess_WhenValidRequest()
        {
            // Arrange
            var category = new EventCategory
            {
                Id = TestCategoryId,
                CategoryName = "Old Name",
            };

            var mockQueryable = new List<EventCategory> { category }.AsQueryable().BuildMock();
            _categoryRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);
            _categoryRepoMock.Setup(r => r.UpdateAsync(It.IsAny<EventCategory>())).ReturnsAsync((EventCategory c) => c);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<EventCategoryResponse>>>>()))
                .Returns<Func<Task<Result<EventCategoryResponse>>>>(func => func());

            var request = new CreateCategoryRequest { EventCategoryName = "New Name" };

            // Act
            var result = await _eventCategoryService.UpdateEventCategoryAsync(TestCategoryId.ToString(), request);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Value);
            Assert.Equal("New Name", result.Value.EventCategoryName);
            _categoryRepoMock.Verify(r => r.UpdateAsync(It.Is<EventCategory>(c => c.CategoryName == "New Name")), Times.Once);
        }

        [Fact]
        public async Task UpdateEventCategoryAsync_ShouldReturnFailure_WhenNameIsEmpty()
        {
            _transactionHelperMock
                    .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<EventCategoryResponse>>>>()))
                    .Returns<Func<Task<Result<EventCategoryResponse>>>>(func => func());

            // Arrange
            var request = new CreateCategoryRequest { EventCategoryName = "" };

            // Act
            var result = await _eventCategoryService.UpdateEventCategoryAsync(TestCategoryId.ToString(), request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
            Assert.Contains("required", result.Error.Message, StringComparison.OrdinalIgnoreCase);

            _categoryRepoMock.Verify(r => r.UpdateAsync(It.IsAny<EventCategory>()), Times.Never);
        }


        [Fact]
        public async Task UpdateEventCategoryAsync_ShouldReturnFailure_WhenCategoryNotFound()
        {
            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<EventCategoryResponse>>>>()))
                .Returns<Func<Task<Result<EventCategoryResponse>>>>(func => func());

            // Arrange
            var request = new CreateCategoryRequest 
            { 
                EventCategoryName = "Updated Name" 
            };
            var mockQueryable = new List<EventCategory>().AsQueryable().BuildMock();

            _categoryRepoMock
                .Setup(r => r.Query(It.IsAny<bool>()))
                .Returns(mockQueryable);

            // Act
            var result = await _eventCategoryService.UpdateEventCategoryAsync(TestCategoryId.ToString(), request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
            Assert.Contains("Can not found", result.Error.Message, StringComparison.OrdinalIgnoreCase);

            _categoryRepoMock.Verify(r => r.UpdateAsync(It.IsAny<EventCategory>()), Times.Never);
        }


        [Fact]
        public async Task UpdateEventCategoryAsync_ShouldReturnFailure_WhenCategoryIsDeleted()
        {
            // Arrange
            var id = Guid.NewGuid();
            var category = new EventCategory
            {
                Id = id,
                CategoryName = "Old Name",
                DeletedAt = new DateTime(2025, 10, 04, 21, 41, 00, DateTimeKind.Utc)
        };

            var mockQueryable = new List<EventCategory> { category }.AsQueryable().BuildMock();
            _categoryRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            var request = new CreateCategoryRequest { EventCategoryName = "New Name" };

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<EventCategoryResponse>>>>()))
                .Returns<Func<Task<Result<EventCategoryResponse>>>>(func => func());

            // Act
            var result = await _eventCategoryService.UpdateEventCategoryAsync(id.ToString(), request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
            Assert.Contains("deleted", result.Error.Message, StringComparison.OrdinalIgnoreCase);
            _categoryRepoMock.Verify(r => r.UpdateAsync(It.IsAny<EventCategory>()), Times.Never);
        }

        [Fact]
        public async Task UpdateEventCategoryAsync_ShouldReturnFailure_WhenInvalidGuid()
        {
            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<EventCategoryResponse>>>>()))
                .Returns<Func<Task<Result<EventCategoryResponse>>>>(func => func());

            // Arrange
            var invalidId = "not-a-guid";
            var request = new CreateCategoryRequest { EventCategoryName = "New Name" };

            // Act
            var result = await _eventCategoryService.UpdateEventCategoryAsync(invalidId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
            Assert.Contains("Invalid category ID format", result.Error.Message);

            _categoryRepoMock.Verify(r => r.UpdateAsync(It.IsAny<EventCategory>()), Times.Never);
        }


        [Fact]
        public async Task UpdateEventCategoryAsync_ShouldReturnFailure_WhenCategoryNameIsExists()
        {
            // Arrange
            var category1 = new EventCategory
            {
                Id = TestCategoryId,
                CategoryName = "Old Name",
            };

            var category = new EventCategory
            {
                Id = Guid.Parse("d4a76e8b-6b14-4f8d-8c3f-42eae2dbeac1"),
                CategoryName = "New Name",
            };

            var mockQueryable = new List<EventCategory> { category, category1 }.AsQueryable().BuildMock();
            _categoryRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            var request = new CreateCategoryRequest { EventCategoryName = "New Name" };

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<EventCategoryResponse>>>>()))
                .Returns<Func<Task<Result<EventCategoryResponse>>>>(func => func());

            // Act
            var result = await _eventCategoryService.UpdateEventCategoryAsync(TestCategoryId.ToString(), request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.NotNull(result.Error);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
            Assert.Contains("Event category name already exists", result.Error.Message, StringComparison.OrdinalIgnoreCase);
            _categoryRepoMock.Verify(r => r.UpdateAsync(It.IsAny<EventCategory>()), Times.Never);
        }

    }
}
