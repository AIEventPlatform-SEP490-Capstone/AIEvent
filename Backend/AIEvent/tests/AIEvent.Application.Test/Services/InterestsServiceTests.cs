using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Interest;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class InterestsServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly IInterestsService _interestsService;
        public InterestsServiceTests()
        {
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _interestsService = new InterestsService (_mockUnitOfWork.Object, _mockTransactionHelper.Object);
        }
        #region Create Interest
        [Fact]
        public async Task CreateInterestAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            var request = new InterestRequest
            {
                InterestName = "Music",
            };

            var map = new Interest { Name = request.InterestName };

            var existing = new Interest
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Technology"
            };

            var interest = new List<Interest> { existing }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false)).Returns(interest.AsNoTracking());

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.InterestRepository.AddAsync(map));


            var result = await _interestsService.CreateInterestAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task CreateInterestAsync_WhenInterestAlreadyExists_ShouldReturnFailureResult()
        {
            // Arrange
            var request = new InterestRequest
            {
                InterestName = "Technology" 
            };

            var existing = new Interest
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "technology"
            };

            var interestList = new List<Interest> { existing }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false)).Returns(interestList.AsNoTracking());

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            var result = await _interestsService.CreateInterestAsync(request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Interest is already existing");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        #endregion

        #region Delete Interest
        [Fact]
        public async Task DeleteInterestAsync_WithExistingInterest_ShouldReturnSuccessResult()
        {
            var id = "22222222-2222-2222-2222-222222222222";
            var existing = new Interest
            {
                Id = Guid.Parse(id),
                Name = "Music",
                DeletedAt = null
            };

            var interestList = new List<Interest> { existing }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false))
                           .Returns(interestList);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                  .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.InterestRepository.DeleteAsync(existing))
                           .Returns(Task.CompletedTask);

            var result = await _interestsService.DeleteInterestAsync(id);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteInterestAsync_WhenInterestNotFound_ShouldReturnFailureResult()
        {
            var id = "33333333-3333-3333-3333-333333333333";

            var emptyList = new List<Interest>().AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false))
                           .Returns(emptyList);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                  .Returns<Func<Task<Result>>>(func => func());

            var result = await _interestsService.DeleteInterestAsync(id);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found or interest is deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task DeleteInterestAsync_WhenInterestAlreadyDeleted_ShouldReturnFailureResult()
        {
            var id = "22222222-2222-2222-2222-222222222222";
            var existing = new Interest
            {
                Id = Guid.Parse(id),
                Name = "Technology",
                DeletedAt = DateTime.UtcNow
            };

            var interestList = new List<Interest> { existing }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false))
                           .Returns(interestList);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                  .Returns<Func<Task<Result>>>(func => func());

            var result = await _interestsService.DeleteInterestAsync(id);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found or interest is deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }



        #endregion

        #region Update Interest
        [Fact]
        public async Task UpdateInterestAsync_WithValidRequest_ShouldReturnSuccessResult()
        {
            var id = "22222222-2222-2222-2222-222222222222";
            var existing = new Interest
            {
                Id = Guid.Parse(id),
                Name = "Old Name",
                DeletedAt = null
            };

            var request = new InterestRequest
            {
                InterestName = "Updated Name"
            };

            var interestList = new List<Interest> { existing }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false))
                           .Returns(interestList);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                  .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.InterestRepository.UpdateAsync(It.IsAny<Interest>()));

            var result = await _interestsService.UpdateInterestAsync(id, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            existing.Name.Should().Be("Updated Name");
        }

        [Fact]
        public async Task UpdateInterestAsync_WhenInterestNotFound_ShouldReturnFailureResult()
        {
            var id = "33333333-3333-3333-3333-333333333333";
            var request = new InterestRequest
            {
                InterestName = "Updated Name"
            };

            var emptyList = new List<Interest>().AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false))
                           .Returns(emptyList);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                  .Returns<Func<Task<Result>>>(func => func());

            var result = await _interestsService.UpdateInterestAsync(id, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found or interest is update");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UpdateInterestAsync_WhenInterestAlreadyDeleted_ShouldReturnFailureResult()
        {
            var id = "22222222-2222-2222-2222-222222222222";
            var existing = new Interest
            {
                Id = Guid.Parse(id),
                Name = "Old Name",
                DeletedAt = DateTime.UtcNow
            };

            var request = new InterestRequest
            {
                InterestName = "Updated Name"
            };

            var interestList = new List<Interest> { existing }.AsQueryable().BuildMock();
            _mockUnitOfWork.Setup(r => r.InterestRepository.Query(false))
                           .Returns(interestList);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                  .Returns<Func<Task<Result>>>(func => func());

            var result = await _interestsService.UpdateInterestAsync(id, request);

            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Can not found or interest is update");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion
    }
}
