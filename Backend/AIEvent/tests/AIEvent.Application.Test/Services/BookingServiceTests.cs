using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class BookingServiceTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<ITransactionHelper> _transactionHelperMock;
        private readonly Mock<ITicketSignatureService> _ticketSignatureServiceMock;
        private readonly Mock<IHangfireJobService> _hangfireJobServiceMock;
        private readonly BookingService _bookingService;

        private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid OrgId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid EventId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        private static readonly Guid TicketTypeId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        private static readonly Guid TicketId = Guid.Parse("55555555-5555-5555-5555-555555555555");

        public BookingServiceTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _transactionHelperMock = new Mock<ITransactionHelper>();
            _ticketSignatureServiceMock = new Mock<ITicketSignatureService>();
            _hangfireJobServiceMock = new Mock<IHangfireJobService>();

            _bookingService = new BookingService(
                _unitOfWorkMock.Object,
                _transactionHelperMock.Object,
                _ticketSignatureServiceMock.Object,
                _hangfireJobServiceMock.Object
            );
        }

        #region CreateBookingAsync Tests
        [Fact]
        public async Task UTCID01_CreateBookingAsync_ShouldReturnError_WhenUserNotFound()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Description = "Test"
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest 
                    { 
                        TicketTypeId = ticketTypeId, 
                        Quantity = 1 
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User>()
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess, "Booking should fail when user does not exist.");
            Assert.Equal("User not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.UserRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID02_CreateBookingAsync_ShouldReturnError_WhenUserIsDeleted()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Deleted User",
                Email = "deleted@test.com",
                IsDeleted = true,  
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "AIEvent 2025",
                Description = "Test",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest 
                    { 
                        TicketTypeId = ticketTypeId, 
                        Quantity = 1 
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("User not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.UserRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID03_CreateBookingAsync_ShouldReturnError_WhenUserInactive()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Inactive User",
                Email = "inactive@test.com",
                IsDeleted = false,
                IsActive = false  
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Title = "AIEvent 2025",
                Description = "Test",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("User not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
            
            _unitOfWorkMock.Verify(u => u.UserRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID04_CreateBookingAsync_ShouldReturnError_WhenEventNotFound()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var existingEvent = new Event
            {
                Id = Guid.NewGuid(), 
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile,
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,   
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest 
                    { 
                        TicketTypeId = ticketTypeId, 
                        Quantity = 1 
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { existingEvent }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Event not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID05_CreateBookingAsync_ShouldReturnError_WhenEventIsDeleted()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var existingEvent = new Event
            {
                Id = eventId,                     
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile,
                IsDeleted = true                  
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { existingEvent }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Event not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID06_CreateBookingAsync_ShouldReturnError_WhenEventStatusIsNotApproved()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.PendingApproval,   
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile,
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { existingEvent }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Event not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID07_CreateBookingAsync_ShouldReturnError_WhenEventPublishFalse()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = false,                    
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile,
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { existingEvent }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Event not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID08_CreateBookingAsync_ShouldReturnError_WhenOrganizerNotFound()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            OrganizerProfile? organizerProfile = null;

            var existingEvent = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile,  
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { existingEvent }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Organizer not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID09_CreateBookingAsync_ShouldReturnError_WhenOrganizerIsDeleted()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
                IsDeleted = true   
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { existingEvent }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Organizer not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID10_CreateBookingAsync_ShouldReturnError_WhenSaleEndTimePassed()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var existingEvent = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),

                SaleStartTime = DateTime.UtcNow.AddDays(-10),
                SaleEndTime = DateTime.UtcNow.AddDays(-1),

                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { existingEvent }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Ticket sales period has passed or not yet come", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);

            _unitOfWorkMock.Verify(u => u.EventRepository.Query(false), Times.Once);
        }


        [Fact]
        public async Task UTCID11_CreateBookingAsync_ShouldReturnError_WhenSaleNotStarted()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(1), 
                SaleEndTime = DateTime.UtcNow.AddDays(3),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            // ===== Mock Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _transactionHelperMock.Setup(t =>
                t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Ticket sales period has passed or not yet come", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID12_CreateBookingAsync_ShouldSucceed_WhenSaleStartTimeEqualsNow()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var now = DateTime.UtcNow;

            // User hợp lệ
            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            // Organizer
            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(2),
                SaleStartTime = now,          
                SaleEndTime = now.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            // ===== Mock Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<List<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<List<Ticket>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            _unitOfWorkMock.Setup(u => u.ExecuteSqlRawAsync(It.IsAny<string>(), It.IsAny<object[]>()))
                .ReturnsAsync(1); 

            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 1000, IsDeleted = false };
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()))
                .ReturnsAsync((WalletTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.WalletRepository.UpdateAsync(It.IsAny<Wallet>()))
                .ReturnsAsync((Wallet b) => b);

            _hangfireJobServiceMock.Setup(h => h.EnqueueSendTicketEmailJobAsync(It.IsAny<SendEmailJobRequest>()))
                .Returns(Task.CompletedTask);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.True(result.IsSuccess, "Booking should succeed when SaleStartTime equals now.");

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }


        [Fact]
        public async Task UTCID13_CreateBookingAsync_ShouldSucceed_WhenSaleEndTimeEqualsNow()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var now = DateTime.UtcNow;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(2),
                SaleStartTime = now.AddDays(-1),
                SaleEndTime = now.AddMilliseconds(1000),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            // ===== Mock Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<List<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<List<Ticket>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            _unitOfWorkMock.Setup(u => u.ExecuteSqlRawAsync(It.IsAny<string>(), It.IsAny<object[]>()))
                .ReturnsAsync(1);

            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 1000, IsDeleted = false };
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()))
                .ReturnsAsync((WalletTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.WalletRepository.UpdateAsync(It.IsAny<Wallet>()))
                .ReturnsAsync((Wallet b) => b);

            _hangfireJobServiceMock.Setup(h => h.EnqueueSendTicketEmailJobAsync(It.IsAny<SendEmailJobRequest>()))
                .Returns(Task.CompletedTask);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.True(result.IsSuccess, "Booking should succeed when SaleEndTime equals now.");

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }


        [Fact]
        public async Task UTCID14_CreateBookingAsync_ShouldReturnError_WhenTicketTypeDoesNotExist()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var validTicketTypeId = TicketTypeId;
            var invalidTicketTypeId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var validTicketType = new TicketType
            {
                Id = validTicketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest { TicketTypeId = validTicketTypeId, Quantity = 1 },
                    new BookingTicketRequest { TicketTypeId = invalidTicketTypeId, Quantity = 2 } 
                }
            };

            // ===== Mock Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { validTicketType }.AsQueryable().BuildMockDbSet().Object);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess, "Booking should fail when a ticket type does not exist.");
            Assert.Equal("One or more ticket types are invalid", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID15_CreateBookingAsync_ShouldReturnError_WhenTicketQuantityIsZero()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 0
                    }
                }
            };

            // ===== Mock Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess, "Booking should fail when ticket quantity is zero.");
            Assert.Equal("Quantity must be greater than 0", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID16_CreateBookingAsync_ShouldReturnError_WhenTicketQuantityIsNegative()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = -1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Quantity must be greater than 0", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }


        [Fact]
        public async Task UTCID17_CreateBookingAsync_ShouldFail_WhenSoldOut()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var now = DateTime.UtcNow;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.ExecuteSqlRawAsync(It.IsAny<string>(), It.IsAny<object[]>()))
                .ReturnsAsync(0);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Not enough tickets for type VIP", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.ExecuteSqlRawAsync(It.IsAny<string>(), It.IsAny<object[]>()), Times.Once);
        }


        [Fact]
        public async Task UTCID18_CreateBookingAsync_ShouldFail_WhenWalletNotFound()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var now = DateTime.UtcNow;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(2),
                SaleStartTime = now.AddDays(-1),
                SaleEndTime = now.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest 
                    { 
                        TicketTypeId = ticketTypeId, 
                        Quantity = 1 
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _unitOfWorkMock.Setup(u => u.ExecuteSqlRawAsync(It.IsAny<string>(), It.IsAny<object[]>()))
                .ReturnsAsync(1);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet>().AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<List<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<List<Ticket>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Wallet user not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);
        }


        [Fact]
        public async Task UTCID19_CreateBookingAsync_ShouldFail_WhenWalletBalanceNotEnough()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var now = DateTime.UtcNow;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(2),
                SaleStartTime = now.AddDays(-1),
                SaleEndTime = now.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            var walletUser = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 99,
                IsDeleted = false
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _unitOfWorkMock.Setup(u => u.ExecuteSqlRawAsync(It.IsAny<string>(), It.IsAny<object[]>()))
                .ReturnsAsync(1);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<List<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<List<Ticket>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Not enough money in wallet", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);
        }

        [Fact]
        public async Task UTCID20_CreateBookingAsync_ShouldSucceed_WhenAllValid()
        {
            // Arrange
            var userId = UserId;
            var organizerId = OrgId;
            var eventId = EventId;
            var ticketTypeId = TicketTypeId;

            var now = DateTime.UtcNow;

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "ABC",
                ContactEmail = "org@test.com",
                ContactName = "Org",
                ContactPhone = "123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0
            };

            var eventEntity = new Event
            {
                Id = eventId,
                Description = "Test",
                Title = "AIEvent 2025",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(2),
                SaleStartTime = now.AddDays(-1),
                SaleEndTime = now.AddDays(1),
                Publish = true,
                Status = EventStatus.Approved,
                RemainingTickets = 100,
                SoldQuantity = 0,
                OrganizerProfile = organizerProfile
            };

            var ticketType = new TicketType
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<BookingTicketRequest>
                {
                    new BookingTicketRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketTypeRepository.Query(false))
                .Returns(new List<TicketType> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 500, IsDeleted = false };
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);

            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<List<BookingItem>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<List<Ticket>>()))
                .Returns(Task.CompletedTask);

            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()))
                .ReturnsAsync((WalletTransaction b) => b);

            _unitOfWorkMock.Setup(u => u.WalletRepository.UpdateAsync(It.IsAny<Wallet>()))
                .ReturnsAsync((Wallet b) => b);

            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            _unitOfWorkMock.Setup(u => u.ExecuteSqlRawAsync(It.IsAny<string>(), It.IsAny<object[]>()))
                .ReturnsAsync(1);

            _hangfireJobServiceMock.Setup(h => h.EnqueueSendTicketEmailJobAsync(It.IsAny<SendEmailJobRequest>()))
                .Returns(Task.CompletedTask);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.True(result.IsSuccess);
            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletRepository.UpdateAsync(It.IsAny<Wallet>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Once);
        }


        //[Fact]
        //public async Task Concurrency_BookingLastTicket_ShouldAllowOnlyOneSuccess()
        //{
        //    // ===== Arrange =====
        //    var options = new DbContextOptionsBuilder<Data>()
        //        .UseSqlServer("Server=.;Database=AIEvent;Uid=sa;Pwd=12345;TrustServerCertificate=True")
        //        .Options;

        //    var context = new BookingDbContext(options);

        //    var unitOfWork = new IUnitOfWork(context);
        //    var transactionHelper = new ITransactionHelper();
        //    var ticketSignatureService = new TicketSignatureService();
        //    var hangfireJobService = new HangfireJobService();

        //    var bookingService1 = new BookingService(unitOfWork, transactionHelper, ticketSignatureService, hangfireJobService);
        //    var bookingService2 = new BookingService(unitOfWork, transactionHelper, ticketSignatureService, hangfireJobService);

        //    var ticketTypeId = Guid.Parse("7f679cd0-3048-4dd9-8655-02331bfee7ab");
        //    var eventId = Guid.Parse("5930440b-bc37-4d0a-9853-e3d46da06308");

        //    var userId1 = Guid.NewGuid();
        //    var userId2 = Guid.NewGuid();

        //    var ticketType = await context.TicketTypes.FindAsync(ticketTypeId);
        //    ticketType.RemainingQuantity = 1;
        //    ticketType.SoldQuantity = 0;
        //    await context.SaveChangesAsync();

        //    var request = new CreateBookingRequest
        //    {
        //        EventId = eventId,
        //        TicketTypeRequests = new List<BookingTicketRequest>
        //        {
        //            new BookingTicketRequest
        //            {
        //                TicketTypeId = ticketTypeId,
        //                Quantity = 1
        //            }
        //        }
        //    };

        //    // ===== Act =====
        //    var task1 = Task.Run(() => bookingService1.CreateBookingAsync(userId1, request));
        //    var task2 = Task.Run(() => bookingService2.CreateBookingAsync(userId2, request));

        //    await Task.WhenAll(task1, task2);

        //    var results = new[] { task1.Result, task2.Result };

        //    // ===== Assert =====
        //    Assert.Equal(1, results.Count(r => r.IsSuccess));
        //    Assert.Equal(1, results.Count(r => !r.IsSuccess && r.Error!.Message.Contains("Not enough tickets")));

        //    foreach (var r in results)
        //    {
        //        Console.WriteLine(r.IsSuccess ? "Booking success" : $"Booking fail: {r.Error?.Message}");
        //    }
        //}
        #endregion



    }
}
