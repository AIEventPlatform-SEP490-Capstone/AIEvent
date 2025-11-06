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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

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

        // UTCID07: Comment is empty string - Success (should skip profanity check)
        [Fact]
        public async Task UTCID07_CreateRatingAsync_WithEmptyComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment = "" (empty string boundary)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 3,
                Comment = ""
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.Comment == "")), Times.Once());
        }

        // UTCID08: Comment is whitespace - Success (should skip profanity check)
        [Fact]
        public async Task UTCID08_CreateRatingAsync_WithWhitespaceComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment = "   " (whitespace boundary)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 3,
                Comment = "   "
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.Comment == "   ")), Times.Once());
        }

        // UTCID09: RatingScore boundary value - Minimum (1) - Success
        [Fact]
        public async Task UTCID09_CreateRatingAsync_WithMinimumRatingScore_ShouldReturnSuccess()
        {
            // Arrange - BV: RatingScore = 1 (minimum boundary)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 1,
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.RatingScore == 1)), Times.Once());
        }

        // UTCID10: RatingScore boundary value - Maximum (5) - Success
        [Fact]
        public async Task UTCID10_CreateRatingAsync_WithMaximumRatingScore_ShouldReturnSuccess()
        {
            // Arrange - BV: RatingScore = 5 (maximum boundary)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Excellent!"
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.RatingScore == 5)), Times.Once());
        }

        // UTCID11: RatingScore middle value (3) - Success
        [Fact]
        public async Task UTCID11_CreateRatingAsync_WithMiddleRatingScore_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 3, middle value)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 3,
                Comment = "Average event"
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.RatingScore == 3)), Times.Once());
        }

        // UTCID12: ContentModerationService returns internal server error - Failure
        [Fact]
        public async Task UTCID12_CreateRatingAsync_WithContentModerationServiceError_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Content moderation service error)
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

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(ErrorResponse.FailureResult("Content moderation service error", ErrorCodes.InternalServerError));

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Content moderation service error");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID13: Booking with Cancelled status - Failure
        [Fact]
        public async Task UTCID13_CreateRatingAsync_WithCancelledBooking_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Booking status is Cancelled)
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
                Status = BookingStatus.Cancelled
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID14: Booking with Reserved status - Failure
        [Fact]
        public async Task UTCID14_CreateRatingAsync_WithReservedBooking_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Booking status is Reserved)
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
                Status = BookingStatus.Reserved
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID15: Booking with Expired status - Failure
        [Fact]
        public async Task UTCID15_CreateRatingAsync_WithExpiredBooking_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Booking status is Expired)
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
                Status = BookingStatus.Expired
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID16: Valid rating with long comment - Success
        [Fact]
        public async Task UTCID16_CreateRatingAsync_WithLongComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment with maximum length boundary
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var longComment = new string('A', 1000); // Long comment
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = longComment
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.Comment == longComment)), Times.Once());
        }

        // UTCID17: Valid rating with special characters in comment - Success
        [Fact]
        public async Task UTCID17_CreateRatingAsync_WithSpecialCharactersInComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Comment with special characters)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event! 👍😊 @#$%^&*()"
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
        }

        // UTCID18: Valid rating with Unicode characters in comment - Success
        [Fact]
        public async Task UTCID18_CreateRatingAsync_WithUnicodeCharactersInComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Comment with Unicode characters)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = "Sự kiện tuyệt vời! 素晴らしいイベント！"
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
        }

        // UTCID19: Different user has booking for same event - Failure (wrong user)
        [Fact]
        public async Task UTCID19_CreateRatingAsync_WithOtherUserBooking_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Booking exists but for different user)
            var userId = Guid.NewGuid();
            var otherUserId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = otherUserId, // Different user
                EventId = eventId,
                Status = BookingStatus.Completed
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID20: Different event has booking for same user - Failure (wrong event)
        [Fact]
        public async Task UTCID20_CreateRatingAsync_WithOtherEventBooking_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Booking exists but for different event)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var otherEventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
            };

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EventId = otherEventId, // Different event
                Status = BookingStatus.Completed
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(new List<Booking> { booking }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID21: Multiple bookings exist but none are completed - Failure
        [Fact]
        public async Task UTCID21_CreateRatingAsync_WithMultipleNonCompletedBookings_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Multiple bookings but none completed)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
            };

            var bookings = new List<Booking>
            {
                new Booking { Id = Guid.NewGuid(), UserId = userId, EventId = eventId, Status = BookingStatus.Pending },
                new Booking { Id = Guid.NewGuid(), UserId = userId, EventId = eventId, Status = BookingStatus.Reserved },
                new Booking { Id = Guid.NewGuid(), UserId = userId, EventId = eventId, Status = BookingStatus.Cancelled }
            };

            _mockUnitOfWork.Setup(x => x.BookingRepository.Query(false))
                .Returns(bookings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("You have not participated in this event.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID22: Valid rating with multiple completed bookings - Success
        [Fact]
        public async Task UTCID22_CreateRatingAsync_WithMultipleCompletedBookings_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Multiple completed bookings for same event)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
            };

            var bookings = new List<Booking>
            {
                new Booking { Id = Guid.NewGuid(), UserId = userId, EventId = eventId, Status = BookingStatus.Completed },
                new Booking { Id = Guid.NewGuid(), UserId = userId, EventId = eventId, Status = BookingStatus.Completed }
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
                .Returns(bookings.AsQueryable().BuildMockDbSet().Object);
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.IsAny<Rating>()), Times.Once());
        }

        // UTCID23: RatingScore = 2 (valid middle-low value) - Success
        [Fact]
        public async Task UTCID23_CreateRatingAsync_WithRatingScoreTwo_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 2)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 2,
                Comment = "Below average"
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.RatingScore == 2)), Times.Once());
        }

        // UTCID24: RatingScore = 4 (valid middle-high value) - Success
        [Fact]
        public async Task UTCID24_CreateRatingAsync_WithRatingScoreFour_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 4)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = "Very good"
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.RatingRepository.AddAsync(It.Is<Rating>(r => r.RatingScore == 4)), Times.Once());
        }

        // UTCID25: Valid rating verifies event stats recalculation - Success
        [Fact]
        public async Task UTCID25_CreateRatingAsync_ShouldRecalculateEventStats_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Verify RecalculateEventStatsAsync is called)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Excellent event!"
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
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating>().AsQueryable().BuildMockDbSet().Object);
            _mockContentModerationService.Setup(x => x.ProfanityChecker(It.IsAny<string>()))
                .ReturnsAsync(Result<string>.Success(null!));
            _mockUnitOfWork.Setup(x => x.RatingRepository.AddAsync(It.IsAny<Rating>())).ReturnsAsync(rating);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockUnitOfWork.Setup(x => x.EventRepository.GetByIdAsync(eventId, true)).ReturnsAsync(eventEntity);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()));
            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(new List<Rating> { rating }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.CreateRatingAsync(userId, eventId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            // Verify that RecalculateEventStatsAsync is called (indirectly through EventRepository.GetByIdAsync and UpdateAsync)
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
        }

        #endregion
    }
}

