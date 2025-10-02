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
        public async Task CreateTagAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            // Arrange
            var request = new CreateTagRequest { NameTag = "Technology" };
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);
            _tagRepoMock.Setup(r => r.AddAsync(It.IsAny<Tag>())).ReturnsAsync((Tag t) => t);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.CreateTagAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            _tagRepoMock.Verify(r => r.AddAsync(It.Is<Tag>(t => t.NameTag == "Technology")), Times.Once);
        }

        [Fact]
        public async Task CreateTagAsync_WhenTagAlreadyExists_ShouldReturnFailure()
        {
            // Arrange
            var request = new CreateTagRequest { NameTag = "Technology" };
            var tags = new List<Tag> { new Tag { Id = Guid.NewGuid(), NameTag = "Technology" } }.AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _tagService.CreateTagAsync(request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Message.Should().Be("Tag is already existing");
            _tagRepoMock.Verify(r => r.AddAsync(It.IsAny<Tag>()), Times.Never);
        }

        // ---------- GetTagByIdAsync ----------

        [Fact]
        public async Task GetTagByIdAsync_WhenTagExists_ShouldReturnSuccess()
        {
            var tagId = Guid.NewGuid();
            var tags = new List<Tag> { new Tag { Id = tagId, NameTag = "Science" } }.AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            var result = await _tagService.GetTagByIdAsync(tagId.ToString());

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.TagName.Should().Be("Science");
        }

        [Fact]
        public async Task GetTagByIdAsync_WhenTagNotFound_ShouldReturnFailure()
        {
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            var result = await _tagService.GetTagByIdAsync(Guid.NewGuid().ToString());

            result.IsSuccess.Should().BeFalse();
            result.Error.Message.Should().Be("Can not found or Tag is deleted");
        }

        // ---------- DeleteTagAsync ----------

        [Fact]
        public async Task DeleteTagAsync_WhenTagExists_ShouldReturnSuccess()
        {
            var tag = new Tag { Id = Guid.NewGuid(), NameTag = "DeleteMe" };
            var tags = new List<Tag> { tag }.AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);
            _tagRepoMock.Setup(r => r.DeleteAsync(It.IsAny<Tag>())).Returns(Task.CompletedTask);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _tagService.DeleteTagAsync(tag.Id.ToString());

            result.IsSuccess.Should().BeTrue();
            _tagRepoMock.Verify(r => r.DeleteAsync(It.Is<Tag>(t => t.Id == tag.Id)), Times.Once);
        }

        [Fact]
        public async Task DeleteTagAsync_WhenTagNotFound_ShouldReturnFailure()
        {
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _tagService.DeleteTagAsync(Guid.NewGuid().ToString());

            result.IsSuccess.Should().BeFalse();
            result.Error.Message.Should().Be("Can not found or Tag is deleted");
        }

        // ---------- UpdateTagAsync ----------

        [Fact]
        public async Task UpdateTagAsync_WhenTagExists_ShouldReturnSuccess()
        {
            // Arrange
            var tag = new Tag { Id = Guid.NewGuid(), NameTag = "OldName" };
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
            var tagId = tag.Id.ToString();
            var result = await _tagService.UpdateTagAsync(tagId, request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value.TagName.Should().Be("NewName");


            _tagRepoMock.Verify(r => r.Query(false), Times.Once);
            _tagRepoMock.Verify(r => r.UpdateAsync(It.Is<Tag>(t => t.NameTag == "NewName")), Times.Once);
        }


        [Fact]
        public async Task UpdateTagAsync_WhenTagNotFound_ShouldReturnFailure()
        {
            var tags = new List<Tag>().AsQueryable();
            var mockQueryable = tags.BuildMock();

            _tagRepoMock.Setup(r => r.Query(false)).Returns(mockQueryable);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result<TagResponse>>>>()))
                .Returns<Func<Task<Result<TagResponse>>>>(func => func());

            var request = new UpdateTagRequest { TagName = "NewName" };
            var result = await _tagService.UpdateTagAsync(Guid.NewGuid().ToString(), request);

            result.IsSuccess.Should().BeFalse();
            result.Error.Message.Should().Be("Can not found or Tag is deleted");
        }
    }
}
