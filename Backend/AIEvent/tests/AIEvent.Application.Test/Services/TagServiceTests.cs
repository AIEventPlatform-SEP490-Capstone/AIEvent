using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
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
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<ITransactionHelper> _transactionHelperMock;
        private readonly Mock<IGenericRepository<Tag>> _tagRepoMock;
        private readonly TagService _tagService;

        public TagServiceTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _transactionHelperMock = new Mock<ITransactionHelper>();
            _tagRepoMock = new Mock<IGenericRepository<Tag>>();

            _unitOfWorkMock.Setup(u => u.TagRepository).Returns(_tagRepoMock.Object);
            _tagService = new TagService(_unitOfWorkMock.Object, _transactionHelperMock.Object);
        }

        // ---------- CreateTagAsync ----------

        [Fact]
        public async Task CreateTagAsync_WithExistingTag_ShouldReturnFailureResult()
        {
            // Arrange
            var request = new CreateTagRequest
            {
                NameTag = "Technology"
            };

            var existingTag = new Tag
            {
                Id = Guid.Parse("d4a76e8b-6b14-4f8d-8c3f-42eae2dbeac1"),
                NameTag = "Technology"
            };

            var tags = new List<Tag> { existingTag }.AsQueryable().BuildMock();

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _tagRepoMock.Setup(r => r.Query(false)).Returns(tags.AsNoTracking());

            // Act
            var result = await _tagService.CreateTagAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Tag is already existing");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            _tagRepoMock.Verify(r => r.AddAsync(It.IsAny<Tag>()), Times.Never);
        }

        [Fact]
        public async Task CreateTagAsync_WhenTagDoesNotExist_ShouldReturnSuccess()
        {
            // Arrange
            var request = new CreateTagRequest
            {
                NameTag = "Science"
            };

            // Không có tag nào trong DB
            var tags = new List<Tag>().AsQueryable().BuildMock();
            _tagRepoMock.Setup(r => r.Query(false)).Returns(tags);

            Tag addedTag = null!;
            _tagRepoMock
                .Setup(r => r.AddAsync(It.IsAny<Tag>()))
                .Callback<Tag>(t => addedTag = t)
                .ReturnsAsync(() => addedTag);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.CreateTagAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();

            addedTag.Should().NotBeNull();
            addedTag.NameTag.Should().Be("Science");

            _tagRepoMock.Verify(r => r.AddAsync(It.IsAny<Tag>()), Times.Once);
        }

        // ---------- GetTagByIdAsync ----------

        [Fact]
        public async Task GetTagByIdAsync_WhenTagExists_ShouldReturnSuccess()
        {
            var tagId = Guid.Parse("a3f6b2d4-8f0e-4f3a-9c5a-9c7c1a2f4b89");
            var tags = new List<Tag> { new Tag { Id = tagId, NameTag = "Science" } }.AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            var result = await _tagService.GetTagByIdAsync(tagId.ToString());

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value!.TagName.Should().Be("Science");
        }

        [Fact]
        public async Task GetTagByIdAsync_WhenTagNotFound_ShouldReturnFailure()
        {
            var nonExistentId = Guid.Parse("c9e0f1a2-5b34-4d87-bf8a-7e5f2e0a4c12");
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            var result = await _tagService.GetTagByIdAsync(nonExistentId.ToString());

            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found or Tag is deleted");
        }

        // ---------- DeleteTagAsync ----------

        [Fact]
        public async Task DeleteTagAsync_WhenTagExists_ShouldReturnSuccess()
        {
            // Arrange
            var tagId = Guid.Parse("a3f6b2d4-8f0e-4f3a-9c5a-9c7c1a2f4b89"); 
            var tag = new Tag 
            { 
                Id = tagId, 
                NameTag = "DeleteMe" 
            };
            var tags = new List<Tag> { tag }.AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);
            _tagRepoMock.Setup(r => r.DeleteAsync(It.IsAny<Tag>())).Returns(Task.CompletedTask);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.DeleteTagAsync(tagId.ToString());

            // Assert
            result.IsSuccess.Should().BeTrue();
            _tagRepoMock.Verify(r => r.DeleteAsync(It.Is<Tag>(t => t.Id == tagId)), Times.Once);
        }

        [Fact]
        public async Task DeleteTagAsync_WhenTagNotFound_ShouldReturnFailure()
        {
            // Arrange
            var nonExistentId = Guid.Parse("c9e0f1a2-5b34-4d87-bf8a-7e5f2e0a4c12"); 
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.DeleteTagAsync(nonExistentId.ToString());

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found or Tag is deleted");
        }


        // ---------- UpdateTagAsync ----------

        [Fact]
        public async Task UpdateTagAsync_WhenTagExists_ShouldReturnSuccess()
        {
            // Arrange
            var id = Guid.Parse("a3f6b2d4-8f0e-4f3a-9c5a-9c7c1a2f4b89");
            var tag = new Tag { Id = id, NameTag = "OldName" };
            var tags = new List<Tag> { tag }.AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(It.IsAny<bool>())).Returns(mockQueryable);
            _tagRepoMock.Setup(r => r.UpdateAsync(It.IsAny<Tag>()))
                .ReturnsAsync((Tag t) => t);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<TagResponse>>>>()))
                .Returns<Func<Task<Result<TagResponse>>>>(func => func());


            var request = new UpdateTagRequest { TagName = "NewName" };

            // Act
            var tagID = tag.Id.ToString();
            var result = await _tagService.UpdateTagAsync(tagID, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.TagName.Should().Be("NewName");


            _tagRepoMock.Verify(r => r.Query(false), Times.Once);
            _tagRepoMock.Verify(r => r.UpdateAsync(It.Is<Tag>(t => t.NameTag == "NewName")), Times.Once);
        }


        [Fact]
        public async Task UpdateTagAsync_WhenTagNotFound_ShouldReturnFailure()
        {
            var nonExistentId = Guid.Parse("c9e0f1a2-5b34-4d87-bf8a-7e5f2e0a4c12");
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<TagResponse>>>>()))
                .Returns<Func<Task<Result<TagResponse>>>>(func => func());

            var request = new UpdateTagRequest { TagName = "NewName" };
            var result = await _tagService.UpdateTagAsync(nonExistentId.ToString(), request);

            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found or Tag is deleted");
        }
    }
}
