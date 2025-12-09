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
        // Test constants
        private static readonly Guid TestUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid TestEventId = Guid.Parse("22222222-2222-2222-2222-2222222222EE");

        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IContentModerationService> _mockContentModerationService;
        private readonly IRatingService _ratingService;

        public RatingServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockContentModerationService = new Mock<IContentModerationService>();
            _ratingService = new RatingService(_mockUnitOfWork.Object, _mockContentModerationService.Object);
        }

        #region CreateRatingAsync

        // UTCID01: Valid rating with completed booking, no comment - Success
        [Fact]
        public async Task UTCID01_CreateRatingAsync_WithValidRequestNoComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore 1-5, Comment null), BV: RatingScore = 5 (max)
            var userId = TestUserId;
            var eventId = TestEventId;
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
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1), // Event ended
                CompletedAt = DateTime.UtcNow.AddHours(-1), // Event is completed
                TotalRatings = 0,
                AverageRating = 0
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.SetupSequence(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object)
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
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
            var userId = TestUserId;
            var eventId = TestEventId;
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
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1),
                CompletedAt = DateTime.UtcNow.AddHours(-1), // Event is completed
                TotalRatings = 0,
                AverageRating = 0
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.SetupSequence(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object)
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
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
            var userId = TestUserId;
            var eventId = TestEventId;
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event! Very well organized."
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1),
                CompletedAt = DateTime.UtcNow.AddHours(-1) // Event is completed
            };
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
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
            var userId = TestUserId;
            var eventId = TestEventId;
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event! Very well organized."
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                Status = BookingStatus.Pending
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1),
                CompletedAt = DateTime.UtcNow.AddHours(-1) // Event is completed
            };
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
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
            var userId = TestUserId;
            var eventId = TestEventId;
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

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1),
                CompletedAt = DateTime.UtcNow.AddHours(-1) // Event is completed
            };
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
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
            var userId = TestUserId;
            var eventId = TestEventId;
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

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1),
                CompletedAt = DateTime.UtcNow.AddHours(-1) // Event is completed
            };
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
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
            var eventId = TestEventId;
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
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID08: Empty eventId - Failure (boundary)
        [Fact]
        public async Task UTCID08_CreateRatingAsync_WithEmptyEventId_ShouldReturnFailure()
        {
            // Arrange - BV: eventId = Guid.Empty (boundary value)
            var userId = TestUserId;
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
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID09: Invalid RatingScore (out of range) - Failure
        [Fact]
        public async Task UTCID09_CreateRatingAsync_WithInvalidRatingScore_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (RatingScore = 6, out of range), BV: RatingScore = 6 (above max)
            var userId = TestUserId;
            var eventId = TestEventId;
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
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID10: RatingScore = 1 (minimum valid) - Success
        [Fact]
        public async Task UTCID10_CreateRatingAsync_WithMinimumRatingScore_ShouldReturnSuccess()
        {
            // Arrange - BV: RatingScore = 1 (minimum valid)
            var userId = TestUserId;
            var eventId = TestEventId;
            var request = new RatingRequest
            {
                RatingScore = 1,
                Comment = "Minimum rating"
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
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1),
                CompletedAt = DateTime.UtcNow.AddHours(-1), // Event is completed
                TotalRatings = 0,
                AverageRating = 0
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.SetupSequence(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object)
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync((Rating r) => r);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.RatingScore == 1)), Times.Once());
        }

        // UTCID11: RatingScore = 0 (below minimum) - Failure
        [Fact]
        public async Task UTCID11_CreateRatingAsync_WithRatingScoreZero_ShouldReturnFailure()
        {
            // Arrange - BV: RatingScore = 0 (below minimum)
            var userId = TestUserId;
            var eventId = TestEventId;
            var request = new RatingRequest
            {
                RatingScore = 0,
                Comment = null
            };

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Rating score must be between 1 and 5.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID12: Event not found - Failure
        [Fact]
        public async Task UTCID12_CreateRatingAsync_WithEventNotFound_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Event is null)
            var userId = TestUserId;
            var eventId = TestEventId;
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = null
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync((Event)null!);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Event not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.BookingRepository.Query(false), Times.Never());
        }

        // UTCID13: Event not completed (CompletedAt == null && EndTime > now) - Failure
        [Fact]
        public async Task UTCID13_CreateRatingAsync_WithEventNotCompleted_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Event not completed)
            var userId = TestUserId;
            var eventId = TestEventId;
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = null
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(2), // Event hasn't ended yet
                CompletedAt = null
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                Status = BookingStatus.Completed
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You can only rate events that have been completed.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID14: Event completed (CompletedAt != null) - Success
        [Fact]
        public async Task UTCID14_CreateRatingAsync_WithEventCompletedAtSet_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Event completed via CompletedAt)
            var userId = TestUserId;
            var eventId = TestEventId;
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
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1), // Event ended
                CompletedAt = DateTime.UtcNow.AddHours(-1), // Event is completed
                TotalRatings = 0,
                AverageRating = 0
            };

            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.SetupSequence(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object)
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        #endregion

        #region DeleteRatingAsync

        // UTCID01: Valid deletion with correct user - Success
        [Fact]
        public async Task UTCID01_DeleteRatingAsync_WithValidRatingAndCorrectUser_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Rating exists, userId matches)
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;

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
            var userId = TestUserId;
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
            var userId = TestUserId;
            var otherUserId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;

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

        // UTCID04: Empty ratingId - Failure (boundary)
        [Fact]
        public async Task UTCID04_DeleteRatingAsync_WithEmptyRatingId_ShouldReturnFailure()
        {
            // Arrange - BV: ratingId = Guid.Empty (boundary value)
            var userId = TestUserId;
            var ratingId = Guid.Empty;

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid Id");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID05: Delete rating with stats recalculation - Success
        [Fact]
        public async Task UTCID05_DeleteRatingAsync_WithStatsRecalculation_ShouldReturnSuccess()
        {
            // Arrange - Test RecalculateEventStatsAsync indirectly
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
                Comment = "Great event"
            };

            var remainingRating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                EventId = eventId,
                RatingScore = 4,
                Comment = "Good event",
                IsDeleted = false
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow.AddDays(-1),
                EndTime = DateTime.UtcNow.AddHours(-1),
                TotalRatings = 2,
                AverageRating = 4.5
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { remainingRating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e => 
                e.TotalRatings == 1 && e.AverageRating == 4.0)), Times.Once());
        }

        // UTCID06: Delete rating when event not found in stats recalculation - Success
        [Fact]
        public async Task UTCID06_DeleteRatingAsync_WithEventNotFoundInStats_ShouldReturnSuccess()
        {
            // Arrange - Test RecalculateEventStatsAsync when event is null
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
                Comment = "Great event"
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.GetByIdAsync(ratingId, true)).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()));
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync((Event)null!);
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.DeleteRatingAsync(userId, ratingId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Never());
        }

        #endregion

        #region GetRatingByEventId

        // UTCID01: Valid eventId with ratings, no userId - Success
        [Fact]
        public async Task UTCID01_GetRatingByEventId_WithValidEventIdAndRatings_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (eventId valid, ratings exist)
            var eventId = TestEventId;
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Never());
        }

        // UTCID03: Valid eventId with no ratings - Success (empty list)
        [Fact]
        public async Task UTCID03_GetRatingByEventId_WithNoRatings_ShouldReturnEmptyList()
        {
            // Arrange - EP: Valid input but no ratings exist
            var eventId = TestEventId;
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

        // UTCID04: Valid eventId with userId (user's rating appears first) - Success
        [Fact]
        public async Task UTCID04_GetRatingByEventId_WithUserId_ShouldReturnUserRatingFirst()
        {
            // Arrange - EP: Valid input with userId (user's rating should appear first)
            var eventId = TestEventId;
            var userId = TestUserId;
            var otherUserId = Guid.NewGuid();

            var user1 = new User { Id = userId, FullName = "Current User", Email = "current@example.com" };
            var user2 = new User { Id = otherUserId, FullName = "Other User", Email = "other@example.com" };

            var userRating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
                Comment = "My rating",
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-2), // Older
                IsDeleted = false,
                User = user1
            };

            var otherRating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId,
                EventId = eventId,
                RatingScore = 4,
                Comment = "Other rating",
                CreatedAt = DateTimeOffset.UtcNow, // Newer
                IsDeleted = false,
                User = user2
            };

            var ratings = new List<Rating> { otherRating, userRating };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, 1, 5);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.Items.First().RatingId.Should().Be(userRating.Id); // User's rating should be first
            result.Value!.Items.First().UserName.Should().Be("Current User");
        }

        // UTCID05: Pagination - pageNumber = 1, pageSize = 1 (boundary) - Success
        [Fact]
        public async Task UTCID05_GetRatingByEventId_WithPaginationBoundary_ShouldReturnCorrectPage()
        {
            // Arrange - BV: pageNumber = 1, pageSize = 1 (minimum page size)
            var eventId = TestEventId;
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 1;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user1.Id,
                    EventId = eventId,
                    RatingScore = 5,
                    Comment = "Rating 1",
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
                    Comment = "Rating 2",
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
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(1);
        }

        // UTCID06: Pagination - pageNumber = 2, pageSize = 5 - Success
        [Fact]
        public async Task UTCID06_GetRatingByEventId_WithSecondPage_ShouldReturnCorrectPage()
        {
            // Arrange - EP: Valid input (pageNumber = 2)
            var eventId = TestEventId;
            Guid? userId = null;
            var pageNumber = 2;
            var pageSize = 5;

            var users = Enumerable.Range(1, 10).Select(i => new User 
            { 
                Id = Guid.NewGuid(), 
                FullName = $"User {i}", 
                Email = $"user{i}@example.com" 
            }).ToList();

            var ratings = users.Select((user, index) => new Rating
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                EventId = eventId,
                RatingScore = 5,
                Comment = $"Rating {index + 1}",
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-index),
                IsDeleted = false,
                User = user
            }).ToList();

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(5); // Second page should have 5 items
            result.Value!.TotalItems.Should().Be(10);
            result.Value!.CurrentPage.Should().Be(2);
        }

        // UTCID07: User with FullName - Success
        [Fact]
        public async Task UTCID07_GetRatingByEventId_WithUserFullName_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (User has FullName)
            var eventId = TestEventId;
            Guid? userId = null;

            var user = new User 
            { 
                Id = Guid.NewGuid(), 
                FullName = "John Doe", 
                Email = "john@example.com" 
            };

            var rating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                EventId = eventId,
                RatingScore = 5,
                Comment = "Great event",
                CreatedAt = DateTimeOffset.UtcNow,
                IsDeleted = false,
                User = user
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, 1, 5);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.First().UserName.Should().Be("John Doe");
        }

        // UTCID08: User without FullName (uses Email) - Success
        [Fact]
        public async Task UTCID08_GetRatingByEventId_WithUserEmailOnly_ShouldReturnEmail()
        {
            // Arrange - EP: Valid input (User has no FullName, uses Email)
            var eventId = TestEventId;
            Guid? userId = null;

            var user = new User 
            { 
                Id = Guid.NewGuid(), 
                FullName = null, 
                Email = "jane@example.com" 
            };

            var rating = new Rating
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                EventId = eventId,
                RatingScore = 4,
                Comment = "Good event",
                CreatedAt = DateTimeOffset.UtcNow,
                IsDeleted = false,
                User = user
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, 1, 5);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.First().UserName.Should().Be("jane@example.com");
        }

        // UTCID09: GetRatingByEventId with deleted ratings filtered - Success
        [Fact]
        public async Task UTCID09_GetRatingByEventId_WithDeletedRatings_ShouldFilterDeleted()
        {
            // Arrange - EP: Valid input (Deleted ratings should be filtered)
            var eventId = TestEventId;
            Guid? userId = null;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user1.Id,
                    EventId = eventId,
                    RatingScore = 5,
                    Comment = "Active rating",
                    CreatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false,
                    User = user1
                },
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user2.Id,
                    EventId = eventId,
                    RatingScore = 4,
                    Comment = "Deleted rating",
                    CreatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = true, // Deleted
                    User = user2
                }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, 1, 5);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1); // Only non-deleted rating
            result.Value!.Items.First().Comment.Should().Be("Active rating");
        }

        #endregion

        #region UpdateRatingAsync

        // UTCID01: Valid update with no comment - Success
        [Fact]
        public async Task UTCID01_UpdateRatingAsync_WithValidRequestNoComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Rating exists, userId matches, Comment null)
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;
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
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;
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
            var userId = TestUserId;
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
            var userId = TestUserId;
            var otherUserId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;
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

        // UTCID05: Empty ratingId - Failure (boundary)
        [Fact]
        public async Task UTCID05_UpdateRatingAsync_WithEmptyRatingId_ShouldReturnFailure()
        {
            // Arrange - BV: ratingId = Guid.Empty (boundary value)
            var userId = TestUserId;
            var ratingId = Guid.Empty;
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Updated comment"
            };

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid Id");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID06: Comment contains profanity - Failure
        [Fact]
        public async Task UTCID06_UpdateRatingAsync_WithProfanityInComment_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Comment contains inappropriate content)
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;
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

        // UTCID07: Invalid RatingScore - Failure
        [Fact]
        public async Task UTCID07_UpdateRatingAsync_WithInvalidRatingScore_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (RatingScore = 6, out of range), BV: RatingScore = 6 (above max)
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID08: Update rating with RatingScore = 0 - Failure
        [Fact]
        public async Task UTCID08_UpdateRatingAsync_WithRatingScoreZero_ShouldReturnFailure()
        {
            // Arrange - BV: RatingScore = 0 (below minimum)
            var userId = TestUserId;
            var ratingId = Guid.NewGuid();
            var eventId = TestEventId;
            var request = new RatingRequest
            {
                RatingScore = 0,
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
