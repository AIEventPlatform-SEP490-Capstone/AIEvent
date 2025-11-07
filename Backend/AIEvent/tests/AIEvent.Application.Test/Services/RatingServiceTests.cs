using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Rating;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class RatingServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IContentModerationService> _mockContentModerationService;
        private readonly IRatingService _ratingService;

        public RatingServiceTests()
        {
            // Khởi tạo mock cho các dependency
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockContentModerationService = new Mock<IContentModerationService>();
            _ratingService = new RatingService(_mockUnitOfWork.Object, _mockContentModerationService.Object);
        }

        #region CreateRatingAsync

        // UTCID01: Valid rating with completed booking, no comment - Success
        [Fact]
        public async Task UTCID01_CreateRatingAsync_WithValidRequestNoComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore 1-5, Comment null)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = null
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                Status = BookingStatus.Completed
            };

            var rating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                RatingScore = request.RatingScore,
                Comment = request.Comment
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 0,
                AverageRating = 0
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.SetupSequence(x => x.RatingRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object)
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r =>
                r.UserId == userId && r.EventId == eventId && r.RatingScore == request.RatingScore && r.Comment == null)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeastOnce());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
        }

        // UTCID02: Valid rating with completed booking and safe comment - Success
        [Fact]
        public async Task UTCID02_CreateRatingAsync_WithValidRequestAndSafeComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore 1-5, Comment with safe content)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = "Great event! Very well organized."
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                Status = BookingStatus.Completed
            };

            var rating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                RatingScore = request.RatingScore,
                Comment = request.Comment
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 0,
                AverageRating = 0
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.SetupSequence(x => x.RatingRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object)
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Once());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r =>
                r.UserId == userId && r.EventId == eventId && r.RatingScore == request.RatingScore && r.Comment == request.Comment)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeastOnce());
        }

        // UTCID03: User has not attended event - Failure
        [Fact]
        public async Task UTCID03_CreateRatingAsync_WithNoCompletedBooking_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (No completed booking)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
        }

        // UTCID04: Booking exists but not completed - Failure
        [Fact]
        public async Task UTCID04_CreateRatingAsync_WithPendingBooking_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Booking exists but status is not Completed)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                Status = BookingStatus.Pending
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Never());
        }

        // UTCID05: User has already rated this event - Failure
        [Fact]
        public async Task UTCID05_CreateRatingAsync_WithExistingRating_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Rating already exists)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                Status = BookingStatus.Completed
            };

            var existingRating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                RatingScore = 4
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { existingRating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have already rated this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
        }

        // UTCID06: Comment contains profanity - Failure
        [Fact]
        public async Task UTCID06_CreateRatingAsync_WithProfanityInComment_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Comment contains inappropriate content)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Bad event with profanity"
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                Status = BookingStatus.Completed
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(ErrorResponse.FailureResult("Inappropriate language detected in field(s): comment", ErrorCodes.InvalidInput));

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Inappropriate language detected in field(s): comment");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Once());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID07: Empty userId - Failure (boundary)
        [Fact]
        public async Task UTCID07_CreateRatingAsync_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange - BV: userId = Guid.Empty (boundary value)
            var userId = Guid.Empty;
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = null
            };

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid Id");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(It.IsAny<bool>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(It.IsAny<bool>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID08: Empty eventId - Failure (boundary)
        [Fact]
        public async Task UTCID08_CreateRatingAsync_WithEmptyEventId_ShouldReturnFailure()
        {
            // Arrange - BV: eventId = Guid.Empty (boundary value)
            var userId = Guid.NewGuid();
            var eventId = Guid.Empty;
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = null
            };

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid Id");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(It.IsAny<bool>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(It.IsAny<bool>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }


        // UTCID09: Invalid RatingScore (out of range) - Failure
        [Fact]
        public async Task UTCID09_CreateRatingAsync_WithInvalidRatingScore_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (RatingScore = 6, out of range)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 6,
                Comment = null
            };

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Rating score must be between 1 and 5.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(It.IsAny<bool>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }

        #endregion

        #region DeleteRatingAsync

        // UTCID01: Valid deletion with correct user - Success
        [Fact]
        public async Task UTCID01_DeleteRatingAsync_WithValidRatingAndCorrectUser_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Rating exists, userId matches)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
                Comment = "Great event"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 5.0
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.Id == ratingId && r.UserId == userId)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Exactly(2)); // Once for delete, once for stats recalculation
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
        }

        // UTCID02: Rating not found - Failure
        [Fact]
        public async Task UTCID02_DeleteRatingAsync_WithNonExistentRating_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Rating is null)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync((Rating)null!);

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: Rating exists but wrong user - Failure
        [Fact]
        public async Task UTCID03_DeleteRatingAsync_WithWrongUser_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Rating exists but userId doesn't match)
            var userId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = otherUserId, // Different user
                EventId = eventId,
                RatingScore = 5,
                Comment = "Great event"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID04: Empty userId - Failure (boundary)
        [Fact]
        public async Task UTCID04_DeleteRatingAsync_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange - BV: userId = Guid.Empty (boundary value)
            var userId = Guid.Empty;
            var ratingId = Guid.NewGuid();

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync((Rating)null!);

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID05: Empty ratingId - Failure (boundary)
        [Fact]
        public async Task UTCID05_DeleteRatingAsync_WithEmptyRatingId_ShouldReturnFailure()
        {
            // Arrange - BV: ratingId = Guid.Empty (boundary value)
            var userId = Guid.NewGuid();
            var ratingId = Guid.Empty;

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync((Rating)null!);

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid Id");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        #endregion

        #region GetRatingByEventId

        // UTCID01: Valid eventId with ratings, no userId - Success
        [Fact]
        public async Task UTCID01_GetRatingByEventId_WithValidEventIdAndRatings_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (eventId valid, ratings exist)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "John Doe", Email = "john@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "Jane Smith", Email = "jane@example.com" };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user1.Id,
                    EventId = eventId,
                    RatingScore = 5,
                    Comment = "Great event",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    IsDeleted = false,
                    User = user1
                },
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user2.Id,
                    EventId = eventId,
                    RatingScore = 4,
                    Comment = "Good event",
                    CreatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false,
                    User = user2
                }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(pageNumber);
            result.Value!.PageSize.Should().Be(pageSize);
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Once());
        }

        // UTCID02: Empty eventId - Failure
        [Fact]
        public async Task UTCID02_GetRatingByEventId_WithEmptyEventId_ShouldReturnFailure()
        {
            // Arrange - BV: eventId = Guid.Empty (boundary value)
            var eventId = Guid.Empty;
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: Valid eventId with no ratings - Success (empty list)
        [Fact]
        public async Task UTCID03_GetRatingByEventId_WithNoRatings_ShouldReturnEmptyList()
        {
            // Arrange - EP: Valid input but no ratings exist
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
            result.Value!.CurrentPage.Should().Be(pageNumber);
            result.Value!.PageSize.Should().Be(pageSize);
        }

        #endregion

        #region UpdateRatingAsync

        // UTCID01: Valid update with no comment - Success
        [Fact]
        public async Task UTCID01_UpdateRatingAsync_WithValidRequestNoComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Rating exists, userId matches, Comment null)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = null
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 3,
                Comment = "Old comment"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 3.0
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r =>
                r.Id == ratingId && r.RatingScore == request.RatingScore && r.Comment == null)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeastOnce());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
        }

        // UTCID02: Valid update with safe comment - Success
        [Fact]
        public async Task UTCID02_UpdateRatingAsync_WithValidRequestAndSafeComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Rating exists, userId matches, Comment with safe content)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = "Updated comment - Great event!"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 3,
                Comment = "Old comment"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 3.0
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r =>
                r.Id == ratingId && r.RatingScore == request.RatingScore && r.Comment == request.Comment)), Times.Once());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeastOnce());
        }

        // UTCID03: Rating not found - Failure
        [Fact]
        public async Task UTCID03_UpdateRatingAsync_WithNonExistentRating_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Rating is null)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Updated comment"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync((Rating)null!);

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()), Times.Never());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
        }

        // UTCID04: Rating exists but wrong user - Failure
        [Fact]
        public async Task UTCID04_UpdateRatingAsync_WithWrongUser_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Rating exists but userId doesn't match)
            var userId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Updated comment"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = otherUserId, // Different user
                EventId = eventId,
                RatingScore = 3,
                Comment = "Old comment"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()), Times.Never());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
        }

        // UTCID05: Empty userId - Failure (boundary)
        [Fact]
        public async Task UTCID05_UpdateRatingAsync_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange - BV: userId = Guid.Empty (boundary value)
            var userId = Guid.Empty;
            var ratingId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Updated comment"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync((Rating)null!);

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID06: Empty ratingId - Failure (boundary)
        [Fact]
        public async Task UTCID06_UpdateRatingAsync_WithEmptyRatingId_ShouldReturnFailure()
        {
            // Arrange - BV: ratingId = Guid.Empty (boundary value)
            var userId = Guid.NewGuid();
            var ratingId = Guid.Empty;
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Updated comment"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync((Rating)null!);

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid Id");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID07: Comment contains profanity - Failure
        [Fact]
        public async Task UTCID07_UpdateRatingAsync_WithProfanityInComment_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Comment contains inappropriate content)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Bad comment with profanity"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 3,
                Comment = "Old comment"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(ErrorResponse.FailureResult("Inappropriate language detected in field(s): comment", ErrorCodes.InvalidInput));

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Inappropriate language detected in field(s): comment");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()), Times.Never());
        }

        [Fact]
        public async Task UTCID08_UpdateRatingAsync_WithRatingScoreInValid_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Comment contains inappropriate content)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 6,
                Comment = "Updated comment"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 3,
                Comment = "Old comment"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Rating score must be between 1 and 5.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }
        #endregion
    }
}

