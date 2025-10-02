using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class TagServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly Mock<IGenericRepository<Tag>> _mockTagRepository;
        private readonly TagService _tagService;

        public TagServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockTagRepository = new Mock<IGenericRepository<Tag>>();

            _mockUnitOfWork.Setup(x => x.TagRepository).Returns(_mockTagRepository.Object);

            _tagService = new TagService(_mockUnitOfWork.Object, _mockTransactionHelper.Object);
        }

        #region CreateTagAsync Tests

        [Fact]
        public async Task CreateTagAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = "Technology"
            };

            var existingTags = new List<Tag>().AsQueryable();
            var mockQueryable = existingTags.BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);
            _mockTagRepository.Setup(x => x.AddAsync(It.IsAny<Tag>()))
                .ReturnsAsync((Tag t) => t);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.CreateTagAsync(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockTagRepository.Verify(x => x.Query(false), Times.Once);
            _mockTagRepository.Verify(x => x.AddAsync(It.Is<Tag>(t => t.NameTag == "Technology")), Times.Once);
        }

        [Fact]
        public async Task CreateTagAsync_WithExistingTagName_ShouldReturnFailureResult()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = "Technology"
            };

            var existingTags = new List<Tag>
            {
                new Tag { Id = Guid.NewGuid(), NameTag = "technology" } // Case insensitive match
            }.AsQueryable();

            var mockQueryable = existingTags.BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.CreateTagAsync(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Tag is already existing");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _mockTagRepository.Verify(x => x.Query(false), Times.Once);
            _mockTagRepository.Verify(x => x.AddAsync(It.IsAny<Tag>()), Times.Never);
        }

        [Fact]
        public async Task CreateTagAsync_WithExistingTagNameDifferentCase_ShouldReturnFailureResult()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = "TECHNOLOGY"
            };

            var existingTags = new List<Tag>
            {
                new Tag { Id = Guid.NewGuid(), NameTag = "Technology" }
            }.AsQueryable();

            var mockQueryable = existingTags.BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.CreateTagAsync(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Tag is already existing");

            _mockTagRepository.Verify(x => x.Query(false), Times.Once);
            _mockTagRepository.Verify(x => x.AddAsync(It.IsAny<Tag>()), Times.Never);
        }

        [Fact]
        public async Task CreateTagAsync_WithWhitespaceTagName_ShouldCreateTagWithTrimmedName()
        {
            // Arrange
            var createTagRequest = new CreateTagRequest
            {
                NameTag = "  Business  "
            };

            var existingTags = new List<Tag>().AsQueryable();
            var mockQueryable = existingTags.BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);
            _mockTagRepository.Setup(x => x.AddAsync(It.IsAny<Tag>()))
                .ReturnsAsync((Tag t) => t);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.CreateTagAsync(createTagRequest);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            _mockTagRepository.Verify(x => x.AddAsync(It.Is<Tag>(t => t.NameTag == "  Business  ")), Times.Once);
        }

        #endregion

        #region GetListTagAsync Tests

        [Fact]
        public async Task GetListTagAsync_WithValidParameters_ShouldReturnPaginatedTags()
        {
            // Arrange
            var tags = new List<Tag>
            {
                new Tag { Id = Guid.NewGuid(), NameTag = "Technology", CreatedAt = DateTime.Now.AddDays(-1) },
                new Tag { Id = Guid.NewGuid(), NameTag = "Business", CreatedAt = DateTime.Now.AddDays(-2) },
                new Tag { Id = Guid.NewGuid(), NameTag = "Health", CreatedAt = DateTime.Now.AddDays(-3) }
            }.AsQueryable();

            var mockQueryable = tags.BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);

            // Act
            var result = await _tagService.GetListTagAsync(1, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(3);
            result.Value.TotalItems.Should().Be(3);
            result.Value.CurrentPage.Should().Be(1);
            result.Value.PageSize.Should().Be(5);

            // Verify ordering by CreatedAt descending
            result.Value.Items.First().TagName.Should().Be("Technology");

            _mockTagRepository.Verify(x => x.Query(false), Times.Once);
        }

        [Fact]
        public async Task GetListTagAsync_WithDeletedTags_ShouldExcludeDeletedTags()
        {
            // Arrange
            var deletedTag = new Tag { Id = Guid.NewGuid(), NameTag = "Business", CreatedAt = DateTime.Now.AddDays(-2) };
            deletedTag.SetDeleted("test-user"); // Mark as deleted

            var tags = new List<Tag>
            {
                new Tag { Id = Guid.NewGuid(), NameTag = "Technology", CreatedAt = DateTime.Now.AddDays(-1) },
                deletedTag,
                new Tag { Id = Guid.NewGuid(), NameTag = "Health", CreatedAt = DateTime.Now.AddDays(-3) }
            }.AsQueryable();

            var mockQueryable = tags.BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);

            // Act
            var result = await _tagService.GetListTagAsync(1, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value.TotalItems.Should().Be(2);

            // Should not include the deleted tag
            result.Value.Items.Should().NotContain(t => t.TagName == "Business");
            result.Value.Items.Should().Contain(t => t.TagName == "Technology");
            result.Value.Items.Should().Contain(t => t.TagName == "Health");

            _mockTagRepository.Verify(x => x.Query(false), Times.Once);
        }

        [Fact]
        public async Task GetListTagAsync_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange
            var tags = new List<Tag>();
            for (int i = 1; i <= 10; i++)
            {
                tags.Add(new Tag
                {
                    Id = Guid.NewGuid(),
                    NameTag = $"Tag{i}",
                    CreatedAt = DateTime.Now.AddDays(-i)
                });
            }

            var mockQueryable = tags.AsQueryable().BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);

            // Act
            var result = await _tagService.GetListTagAsync(2, 3); // Page 2, 3 items per page

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(3);
            result.Value.TotalItems.Should().Be(10);
            result.Value.CurrentPage.Should().Be(2);
            result.Value.PageSize.Should().Be(3);

            _mockTagRepository.Verify(x => x.Query(false), Times.Once);
        }

        [Fact]
        public async Task GetListTagAsync_WithNoTags_ShouldReturnEmptyResult()
        {
            // Arrange
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _mockTagRepository.Setup(x => x.Query(false))
                .Returns(mockQueryable);

            // Act
            var result = await _tagService.GetListTagAsync(1, 5);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty();
            result.Value.TotalItems.Should().Be(0);

            _mockTagRepository.Verify(x => x.Query(false), Times.Once);
        }

        #endregion
    }
}
