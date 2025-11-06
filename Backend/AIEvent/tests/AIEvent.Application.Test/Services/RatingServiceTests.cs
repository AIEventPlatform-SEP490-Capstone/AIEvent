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
            // Verify that RecalculateEventStatsAsync is called (indirectly through EventRepository.GetByIdAsync and UpdateAsync)
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
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
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID06: Valid deletion verifies soft delete disable/enable - Success
        [Fact]
        public async Task UTCID06_DeleteRatingAsync_ShouldDisableAndEnableSoftDelete_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Verify soft delete is disabled then enabled)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 4,
                Comment = "Good event"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 4.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()), Times.Once());
            // Note: We can't directly verify DisableSoftDelete/EnableSoftDelete as they're internal methods,
            // but we verify the DeleteAsync is called which requires soft delete to be disabled
        }

        // UTCID07: Valid deletion with rating score 1 - Success
        [Fact]
        public async Task UTCID07_DeleteRatingAsync_WithMinimumRatingScore_ShouldReturnSuccess()
        {
            // Arrange - BV: RatingScore = 1 (minimum boundary)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 1,
                Comment = "Poor event"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 1.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.RatingScore == 1)), Times.Once());
        }

        // UTCID08: Valid deletion with rating score 5 - Success
        [Fact]
        public async Task UTCID08_DeleteRatingAsync_WithMaximumRatingScore_ShouldReturnSuccess()
        {
            // Arrange - BV: RatingScore = 5 (maximum boundary)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
                Comment = "Excellent event"
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.RatingScore == 5)), Times.Once());
        }

        // UTCID09: Valid deletion with null comment - Success
        [Fact]
        public async Task UTCID09_DeleteRatingAsync_WithNullComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Comment is null)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 3,
                Comment = null
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.Comment == null)), Times.Once());
        }

        // UTCID10: Valid deletion with empty comment - Success
        [Fact]
        public async Task UTCID10_DeleteRatingAsync_WithEmptyComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment = "" (empty string boundary)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 2,
                Comment = ""
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 2.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.Comment == "")), Times.Once());
        }

        // UTCID11: Valid deletion verifies event stats recalculation - Success
        [Fact]
        public async Task UTCID11_DeleteRatingAsync_ShouldRecalculateEventStats_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Verify RecalculateEventStatsAsync is called)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 4,
                Comment = "Good event"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 4.0
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
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
        }

        // UTCID12: Valid deletion with rating score 3 (middle value) - Success
        [Fact]
        public async Task UTCID12_DeleteRatingAsync_WithMiddleRatingScore_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 3, middle value)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 3,
                Comment = "Average event"
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.RatingScore == 3)), Times.Once());
        }

        // UTCID13: Valid deletion with long comment - Success
        [Fact]
        public async Task UTCID13_DeleteRatingAsync_WithLongComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment with maximum length boundary
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var longComment = new string('A', 1000);

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 4,
                Comment = longComment
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 4.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.Comment == longComment)), Times.Once());
        }

        // UTCID14: Rating with special characters in comment - Success
        [Fact]
        public async Task UTCID14_DeleteRatingAsync_WithSpecialCharactersInComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Comment with special characters)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
                Comment = "Great event! 👍😊 @#$%^&*()"
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()), Times.Once());
        }

        // UTCID15: Rating with Unicode characters in comment - Success
        [Fact]
        public async Task UTCID15_DeleteRatingAsync_WithUnicodeCharactersInComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Comment with Unicode characters)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 4,
                Comment = "Sự kiện tuyệt vời! 素晴らしいイベント！"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 4.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.IsAny<Rating>()), Times.Once());
        }

        // UTCID16: Valid deletion with rating score 2 - Success
        [Fact]
        public async Task UTCID16_DeleteRatingAsync_WithRatingScoreTwo_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 2)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 2,
                Comment = "Below average"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 2.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.RatingScore == 2)), Times.Once());
        }

        // UTCID17: Valid deletion with rating score 4 - Success
        [Fact]
        public async Task UTCID17_DeleteRatingAsync_WithRatingScoreFour_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 4)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 4,
                Comment = "Very good"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 4.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.DeleteAsync(It.Is<Rating>(r => r.RatingScore == 4)), Times.Once());
        }

        // UTCID18: Valid deletion verifies SaveChangesAsync called twice - Success
        [Fact]
        public async Task UTCID18_DeleteRatingAsync_ShouldCallSaveChangesTwice_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Verify SaveChangesAsync called for delete and stats recalculation)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
                Comment = "Excellent"
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
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Exactly(2)); // Once for delete, once for stats recalculation
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

        // UTCID04: Valid eventId with ratings, userId provided - User's rating first
        [Fact]
        public async Task UTCID04_GetRatingByEventId_WithUserId_ShouldReturnUserRatingFirst()
        {
            // Arrange - EP: Valid input with userId (user's rating should come first)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var pageNumber = 1;
            var pageSize = 5;

            var user1 = new User { Id = userId, FullName = "Current User", Email = "current@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "Other User", Email = "other@example.com" };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user2.Id,
                    EventId = eventId,
                    RatingScore = 4,
                    Comment = "Other user rating",
                    CreatedAt = DateTimeOffset.UtcNow, // More recent
                    IsDeleted = false,
                    User = user2
                },
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user1.Id,
                    EventId = eventId,
                    RatingScore = 5,
                    Comment = "My rating",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), // Older
                    IsDeleted = false,
                    User = user1
                }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.Items.First().RatingId.Should().Be(ratings[1].Id); // User's rating should be first
            result.Value!.Items.First().UserName.Should().Be("Current User");
            _mockUnitOfWork.Verify(x => x.RatingRepository.Query(false), Times.Once());
        }

        // UTCID05: Pagination - pageNumber = 1 (boundary minimum)
        [Fact]
        public async Task UTCID05_GetRatingByEventId_WithPageNumberOne_ShouldReturnFirstPage()
        {
            // Arrange - BV: pageNumber = 1 (minimum boundary)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 2;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };
            var user3 = new User { Id = Guid.NewGuid(), FullName = "User 3", Email = "user3@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user1.Id, EventId = eventId, RatingScore = 5, Comment = "Rating 1", CreatedAt = DateTimeOffset.UtcNow.AddDays(-2), IsDeleted = false, User = user1 },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = eventId, RatingScore = 4, Comment = "Rating 2", CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), IsDeleted = false, User = user2 },
                new Rating { Id = Guid.NewGuid(), UserId = user3.Id, EventId = eventId, RatingScore = 3, Comment = "Rating 3", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user3 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2); // First page with 2 items
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(2);
        }

        // UTCID06: Pagination - pageNumber = 2
        [Fact]
        public async Task UTCID06_GetRatingByEventId_WithPageNumberTwo_ShouldReturnSecondPage()
        {
            // Arrange - EP: Valid input (pageNumber > 1)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 2;
            var pageSize = 2;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };
            var user3 = new User { Id = Guid.NewGuid(), FullName = "User 3", Email = "user3@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user1.Id, EventId = eventId, RatingScore = 5, Comment = "Rating 1", CreatedAt = DateTimeOffset.UtcNow.AddDays(-2), IsDeleted = false, User = user1 },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = eventId, RatingScore = 4, Comment = "Rating 2", CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), IsDeleted = false, User = user2 },
                new Rating { Id = Guid.NewGuid(), UserId = user3.Id, EventId = eventId, RatingScore = 3, Comment = "Rating 3", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user3 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1); // Second page with 1 item
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(2);
            result.Value!.PageSize.Should().Be(2);
        }

        // UTCID07: Pagination - pageSize = 1 (boundary minimum)
        [Fact]
        public async Task UTCID07_GetRatingByEventId_WithPageSizeOne_ShouldReturnOneItem()
        {
            // Arrange - BV: pageSize = 1 (minimum boundary)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 1;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user1.Id, EventId = eventId, RatingScore = 5, Comment = "Rating 1", CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), IsDeleted = false, User = user1 },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = eventId, RatingScore = 4, Comment = "Rating 2", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user2 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.PageSize.Should().Be(1);
        }

        // UTCID08: Pagination - pageSize = 5 (default)
        [Fact]
        public async Task UTCID08_GetRatingByEventId_WithDefaultPageSize_ShouldReturnDefaultPageSize()
        {
            // Arrange - EP: Valid input (pageSize = 5, default value)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };
            var user3 = new User { Id = Guid.NewGuid(), FullName = "User 3", Email = "user3@example.com" };
            var user4 = new User { Id = Guid.NewGuid(), FullName = "User 4", Email = "user4@example.com" };
            var user5 = new User { Id = Guid.NewGuid(), FullName = "User 5", Email = "user5@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user1.Id, EventId = eventId, RatingScore = 5, Comment = "Rating 1", CreatedAt = DateTimeOffset.UtcNow.AddDays(-4), IsDeleted = false, User = user1 },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = eventId, RatingScore = 4, Comment = "Rating 2", CreatedAt = DateTimeOffset.UtcNow.AddDays(-3), IsDeleted = false, User = user2 },
                new Rating { Id = Guid.NewGuid(), UserId = user3.Id, EventId = eventId, RatingScore = 3, Comment = "Rating 3", CreatedAt = DateTimeOffset.UtcNow.AddDays(-2), IsDeleted = false, User = user3 },
                new Rating { Id = Guid.NewGuid(), UserId = user4.Id, EventId = eventId, RatingScore = 2, Comment = "Rating 4", CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), IsDeleted = false, User = user4 },
                new Rating { Id = Guid.NewGuid(), UserId = user5.Id, EventId = eventId, RatingScore = 1, Comment = "Rating 5", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user5 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(5);
            result.Value!.TotalItems.Should().Be(5);
            result.Value!.PageSize.Should().Be(5);
        }

        // UTCID09: Pagination - pageSize > 5
        [Fact]
        public async Task UTCID09_GetRatingByEventId_WithLargePageSize_ShouldReturnAllItems()
        {
            // Arrange - EP: Valid input (pageSize > default)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 10;

            var users = Enumerable.Range(1, 8).Select(i => new User 
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
                RatingScore = (byte)(5 - index % 5),
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
            result.Value!.Items.Should().HaveCount(8);
            result.Value!.TotalItems.Should().Be(8);
            result.Value!.PageSize.Should().Be(10);
        }

        // UTCID10: Deleted ratings filtered out
        [Fact]
        public async Task UTCID10_GetRatingByEventId_ShouldFilterDeletedRatings_ShouldReturnOnlyNonDeleted()
        {
            // Arrange - EP: Valid input (Some ratings are deleted, should be filtered)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };
            var user3 = new User { Id = Guid.NewGuid(), FullName = "User 3", Email = "user3@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user1.Id, EventId = eventId, RatingScore = 5, Comment = "Rating 1", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user1 },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = eventId, RatingScore = 4, Comment = "Rating 2", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = true, User = user2 }, // Deleted
                new Rating { Id = Guid.NewGuid(), UserId = user3.Id, EventId = eventId, RatingScore = 3, Comment = "Rating 3", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user3 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2); // Only non-deleted ratings
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.Items.Should().NotContain(r => r.RatingId == ratings[1].Id); // Deleted rating should not be in results
        }

        // UTCID11: User with FullName (preferred over Email)
        [Fact]
        public async Task UTCID11_GetRatingByEventId_WithUserFullName_ShouldReturnFullName()
        {
            // Arrange - EP: Valid input (User has FullName, should use FullName)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user = new User 
            { 
                Id = Guid.NewGuid(), 
                FullName = "John Doe", 
                Email = "john@example.com" 
            };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    EventId = eventId,
                    RatingScore = 5,
                    Comment = "Great event",
                    CreatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false,
                    User = user
                }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().UserName.Should().Be("John Doe"); // Should use FullName, not Email
        }

        // UTCID12: User with only Email (no FullName)
        [Fact]
        public async Task UTCID12_GetRatingByEventId_WithUserOnlyEmail_ShouldReturnEmail()
        {
            // Arrange - EP: Valid input (User has no FullName, should use Email)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user = new User 
            { 
                Id = Guid.NewGuid(), 
                FullName = null, 
                Email = "jane@example.com" 
            };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    EventId = eventId,
                    RatingScore = 4,
                    Comment = "Good event",
                    CreatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false,
                    User = user
                }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().UserName.Should().Be("jane@example.com"); // Should use Email when FullName is null
        }

        // UTCID13: Multiple ratings ordering - by CreatedAt descending
        [Fact]
        public async Task UTCID13_GetRatingByEventId_ShouldOrderByCreatedAtDescending_ShouldReturnNewestFirst()
        {
            // Arrange - EP: Valid input (Multiple ratings should be ordered by CreatedAt descending)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };
            var user3 = new User { Id = Guid.NewGuid(), FullName = "User 3", Email = "user3@example.com" };

            var now = DateTimeOffset.UtcNow;
            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user1.Id, EventId = eventId, RatingScore = 5, Comment = "Oldest", CreatedAt = now.AddDays(-2), IsDeleted = false, User = user1 },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = eventId, RatingScore = 4, Comment = "Newest", CreatedAt = now, IsDeleted = false, User = user2 },
                new Rating { Id = Guid.NewGuid(), UserId = user3.Id, EventId = eventId, RatingScore = 3, Comment = "Middle", CreatedAt = now.AddDays(-1), IsDeleted = false, User = user3 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(3);
            result.Value!.Items.First().Comment.Should().Be("Newest"); // Most recent first
            result.Value!.Items.Last().Comment.Should().Be("Oldest"); // Oldest last
        }

        // UTCID14: Ratings from different events filtered out
        [Fact]
        public async Task UTCID14_GetRatingByEventId_ShouldFilterByEventId_ShouldReturnOnlyMatchingEvent()
        {
            // Arrange - EP: Valid input (Ratings from different events should be filtered)
            var eventId = Guid.NewGuid();
            var otherEventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user1 = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user1.Id, EventId = eventId, RatingScore = 5, Comment = "Rating for event", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user1 },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = otherEventId, RatingScore = 4, Comment = "Rating for other event", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user2 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1); // Only rating for the requested event
            result.Value!.TotalItems.Should().Be(1);
            result.Value!.Items.First().Comment.Should().Be("Rating for event");
        }

        // UTCID15: Default pageNumber and pageSize
        [Fact]
        public async Task UTCID15_GetRatingByEventId_WithDefaultParameters_ShouldUseDefaultValues()
        {
            // Arrange - EP: Valid input (Using default pageNumber=1, pageSize=5)
            var eventId = Guid.NewGuid();
            Guid? userId = null;

            var user = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user.Id, EventId = eventId, RatingScore = 5, Comment = "Rating", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId); // Using default parameters

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.CurrentPage.Should().Be(1); // Default
            result.Value!.PageSize.Should().Be(5); // Default
        }

        // UTCID16: User's rating first, then others ordered by CreatedAt
        [Fact]
        public async Task UTCID16_GetRatingByEventId_WithUserId_ShouldPrioritizeUserRatingThenOrderByDate()
        {
            // Arrange - EP: Valid input (User's rating first, then others by CreatedAt desc)
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var pageNumber = 1;
            var pageSize = 5;

            var currentUser = new User { Id = userId, FullName = "Current User", Email = "current@example.com" };
            var user2 = new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" };
            var user3 = new User { Id = Guid.NewGuid(), FullName = "User 3", Email = "user3@example.com" };

            var now = DateTimeOffset.UtcNow;
            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user3.Id, EventId = eventId, RatingScore = 3, Comment = "Newest other", CreatedAt = now, IsDeleted = false, User = user3 },
                new Rating { Id = Guid.NewGuid(), UserId = currentUser.Id, EventId = eventId, RatingScore = 5, Comment = "My old rating", CreatedAt = now.AddDays(-2), IsDeleted = false, User = currentUser },
                new Rating { Id = Guid.NewGuid(), UserId = user2.Id, EventId = eventId, RatingScore = 4, Comment = "Older other", CreatedAt = now.AddDays(-1), IsDeleted = false, User = user2 }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(3);
            result.Value!.Items.First().Comment.Should().Be("My old rating"); // User's rating first
            result.Value!.Items.Skip(1).First().Comment.Should().Be("Newest other"); // Then newest
            result.Value!.Items.Last().Comment.Should().Be("Older other"); // Then oldest
        }

        // UTCID17: Boundary - totalCount exactly equals pageSize
        [Fact]
        public async Task UTCID17_GetRatingByEventId_WithExactPageSizeCount_ShouldReturnFullPage()
        {
            // Arrange - BV: TotalCount = pageSize (exact boundary)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 3;

            var users = Enumerable.Range(1, 3).Select(i => new User 
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
            result.Value!.Items.Should().HaveCount(3); // Exactly pageSize
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.PageSize.Should().Be(3);
        }

        // UTCID18: Boundary - pageNumber beyond available pages
        [Fact]
        public async Task UTCID18_GetRatingByEventId_WithPageNumberBeyondAvailable_ShouldReturnEmptyPage()
        {
            // Arrange - BV: pageNumber > total pages (boundary)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 10; // Beyond available pages
            var pageSize = 5;

            var user = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };

            var ratings = new List<Rating>
            {
                new Rating { Id = Guid.NewGuid(), UserId = user.Id, EventId = eventId, RatingScore = 5, Comment = "Only rating", CreatedAt = DateTimeOffset.UtcNow, IsDeleted = false, User = user }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().BeEmpty(); // No items on page 10
            result.Value!.TotalItems.Should().Be(1);
            result.Value!.CurrentPage.Should().Be(10);
        }

        // UTCID19: Rating with null comment
        [Fact]
        public async Task UTCID19_GetRatingByEventId_WithNullComment_ShouldReturnNullInResponse()
        {
            // Arrange - EP: Valid input (Rating with null comment)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    EventId = eventId,
                    RatingScore = 5,
                    Comment = null,
                    CreatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false,
                    User = user
                }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().Comment.Should().BeNull();
        }

        // UTCID20: Rating with empty comment
        [Fact]
        public async Task UTCID20_GetRatingByEventId_WithEmptyComment_ShouldReturnEmptyString()
        {
            // Arrange - BV: Comment = "" (empty string boundary)
            var eventId = Guid.NewGuid();
            Guid? userId = null;
            var pageNumber = 1;
            var pageSize = 5;

            var user = new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" };

            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    EventId = eventId,
                    RatingScore = 4,
                    Comment = "",
                    CreatedAt = DateTimeOffset.UtcNow,
                    IsDeleted = false,
                    User = user
                }
            };

            _mockUnitOfWork.Setup(x => x.RatingRepository.Query(false))
                .Returns(ratings.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _ratingService.GetRatingByEventId(userId, eventId, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().Comment.Should().Be("");
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
            result.Error!.Message.Should().Be("Not found or you do not have permission.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.RatingRepository.GetByIdAsync(ratingId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()), Times.Never());
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

        // UTCID08: Comment is empty string - Success (should skip profanity check)
        [Fact]
        public async Task UTCID08_UpdateRatingAsync_WithEmptyComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment = "" (empty string boundary)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 3,
                Comment = ""
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
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
                AverageRating = 5.0
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.Comment == "")), Times.Once());
        }

        // UTCID09: Comment is whitespace - Success (should skip profanity check)
        [Fact]
        public async Task UTCID09_UpdateRatingAsync_WithWhitespaceComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment = "   " (whitespace boundary)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 3,
                Comment = "   "
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
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
                AverageRating = 5.0
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.Comment == "   ")), Times.Once());
        }

        // UTCID10: RatingScore boundary value - Minimum (1) - Success
        [Fact]
        public async Task UTCID10_UpdateRatingAsync_WithMinimumRatingScore_ShouldReturnSuccess()
        {
            // Arrange - BV: RatingScore = 1 (minimum boundary)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 1,
                Comment = null
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
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
                AverageRating = 5.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.RatingScore == 1)), Times.Once());
        }

        // UTCID11: RatingScore boundary value - Maximum (5) - Success
        [Fact]
        public async Task UTCID11_UpdateRatingAsync_WithMaximumRatingScore_ShouldReturnSuccess()
        {
            // Arrange - BV: RatingScore = 5 (maximum boundary)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Excellent!"
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.RatingScore == 5)), Times.Once());
        }

        // UTCID12: RatingScore middle value (3) - Success
        [Fact]
        public async Task UTCID12_UpdateRatingAsync_WithMiddleRatingScore_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 3, middle value)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 3,
                Comment = "Average event"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
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
                AverageRating = 5.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.RatingScore == 3)), Times.Once());
        }

        // UTCID13: ContentModerationService returns internal server error - Failure
        [Fact]
        public async Task UTCID13_UpdateRatingAsync_WithContentModerationServiceError_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Content moderation service error)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event!"
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
                .ReturnsAsync(ErrorResponse.FailureResult("Content moderation service error", ErrorCodes.InternalServerError));

            // Act
            var result = await _ratingService.UpdateRatingAsync(userId, ratingId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Content moderation service error");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.IsAny<Rating>()), Times.Never());
        }

        // UTCID14: Valid update verifies event stats recalculation - Success
        [Fact]
        public async Task UTCID14_UpdateRatingAsync_ShouldRecalculateEventStats_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Verify RecalculateEventStatsAsync is called)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Excellent event!"
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
            _mockUnitOfWork.Verify(x => x.EventRepository.GetByIdAsync(eventId, true), Times.Once());
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Once());
        }

        // UTCID15: Valid update with long comment - Success
        [Fact]
        public async Task UTCID15_UpdateRatingAsync_WithLongComment_ShouldReturnSuccess()
        {
            // Arrange - BV: Comment with maximum length boundary
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var longComment = new string('A', 1000);
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = longComment
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.Comment == longComment)), Times.Once());
        }

        // UTCID16: Valid update with special characters in comment - Success
        [Fact]
        public async Task UTCID16_UpdateRatingAsync_WithSpecialCharactersInComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Comment with special characters)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Great event! 👍😊 @#$%^&*()"
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
        }

        // UTCID17: Valid update with Unicode characters in comment - Success
        [Fact]
        public async Task UTCID17_UpdateRatingAsync_WithUnicodeCharactersInComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Comment with Unicode characters)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = "Sự kiện tuyệt vời! 素晴らしいイベント！"
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
        }

        // UTCID18: RatingScore = 2 (valid middle-low value) - Success
        [Fact]
        public async Task UTCID18_UpdateRatingAsync_WithRatingScoreTwo_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 2)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 2,
                Comment = "Below average"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 5,
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
                AverageRating = 5.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.RatingScore == 2)), Times.Once());
        }

        // UTCID19: RatingScore = 4 (valid middle-high value) - Success
        [Fact]
        public async Task UTCID19_UpdateRatingAsync_WithRatingScoreFour_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (RatingScore = 4)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = "Very good"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 2,
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
                AverageRating = 2.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r => r.RatingScore == 4)), Times.Once());
        }

        // UTCID20: Update both RatingScore and Comment - Success
        [Fact]
        public async Task UTCID20_UpdateRatingAsync_WithBothRatingScoreAndComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Update both RatingScore and Comment)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Updated to excellent rating"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 2,
                Comment = "Old poor comment"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 2.0
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r =>
                r.RatingScore == request.RatingScore && r.Comment == request.Comment)), Times.Once());
        }

        // UTCID21: Update only RatingScore (Comment remains null) - Success
        [Fact]
        public async Task UTCID21_UpdateRatingAsync_WithOnlyRatingScoreUpdate_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Update only RatingScore, Comment was null and remains null)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = null
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 2,
                Comment = null
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 2.0
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r =>
                r.RatingScore == request.RatingScore && r.Comment == null)), Times.Once());
        }

        // UTCID22: Update only Comment (RatingScore unchanged) - Success
        [Fact]
        public async Task UTCID22_UpdateRatingAsync_WithOnlyCommentUpdate_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Update only Comment, RatingScore unchanged)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 3,
                Comment = "Updated comment only"
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
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r =>
                r.RatingScore == 3 && r.Comment == "Updated comment only")), Times.Once());
        }

        // UTCID23: Valid update verifies SaveChangesAsync called twice - Success
        [Fact]
        public async Task UTCID23_UpdateRatingAsync_ShouldCallSaveChangesTwice_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Verify SaveChangesAsync called for update and stats recalculation)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 5,
                Comment = "Excellent"
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
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Exactly(2)); // Once for update, once for stats recalculation
        }

        // UTCID24: Update from null comment to valid comment - Success
        [Fact]
        public async Task UTCID24_UpdateRatingAsync_FromNullCommentToValidComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Update from null comment to valid comment)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = "Adding comment to previously null comment"
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 4,
                Comment = null
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 4.0
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Once());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r =>
                r.Comment == "Adding comment to previously null comment")), Times.Once());
        }

        // UTCID25: Update from valid comment to null comment - Success
        [Fact]
        public async Task UTCID25_UpdateRatingAsync_FromValidCommentToNullComment_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (Update from valid comment to null comment)
            var userId = Guid.NewGuid();
            var ratingId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var request = new RatingRequest
            {
                RatingScore = 4,
                Comment = null
            };

            var rating = new Rating
            {
                Id = ratingId,
                UserId = userId,
                EventId = eventId,
                RatingScore = 4,
                Comment = "Removing this comment"
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "Test Event",
                Description = "Test Description",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(2),
                TotalRatings = 1,
                AverageRating = 4.0
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
            _mockContentModerationService.Verify(x => x.ProfanityChecker(It.IsAny<string>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.RatingRepository.UpdateAsync(It.Is<Rating>(r =>
                r.Comment == null)), Times.Once());
        }

        #endregion
    }
}

