using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
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
    public class BookingServiceTests
    {
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<ITransactionHelper> _transactionHelperMock;
        private readonly Mock<IQrCodeService> _qrCodeServiceMock;
        private readonly Mock<IPdfService> _pdfServiceMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<ITicketTokenService> _ticketTokenServiceMock;
        private readonly BookingService _bookingService;

        private static readonly Guid UserId = Guid.Parse("a3f4a95e-27fb-4d32-b2c1-1f4a5c6e8d9b");
        private static readonly Guid OrgId = Guid.Parse("f2c8e66b-54ad-4b16-8ad2-2e2d7c35e9cb");
        private static readonly Guid EventId = Guid.Parse("b6c3d2a7-3b4a-41f8-94b8-1a3b72e5a7a1");
        private static readonly Guid TicketTypeId = Guid.Parse("c4c6a2a9-bb8d-41ee-94b2-8a9f4c890bde");

        public BookingServiceTests()
        {
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _transactionHelperMock = new Mock<ITransactionHelper>();
            _qrCodeServiceMock = new Mock<IQrCodeService>();
            _pdfServiceMock = new Mock<IPdfService>();
            _emailServiceMock = new Mock<IEmailService>();
            _ticketTokenServiceMock = new Mock<ITicketTokenService>();

            _bookingService = new BookingService(
                _unitOfWorkMock.Object,
                _transactionHelperMock.Object,
                _qrCodeServiceMock.Object,
                _ticketTokenServiceMock.Object,
                _pdfServiceMock.Object,
                _emailServiceMock.Object
            );
        }

        #region CreateBookingAsync Tests
        [Fact]
        public async Task UTCID01_CreateBookingAsync_ShouldReturnSuccess_WhenAllValid_AndWalletHasEnoughMoney()
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
                ContactEmail = "test@gmail.com",
                ContactName = "Test",
                ContactPhone = "1234567890",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Description",
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100,
            };

            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 1000 };
            var walletOrg = new Wallet { Id = Guid.NewGuid(), UserId = organizerId, Balance = 500 };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
                {
                    new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 2 }
                }
            };

            // ===== Mock Queryable Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMock());

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);

            // ===== Mock Async Repository Actions =====
            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);
            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<IEnumerable<Ticket>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.UpdateRangeAsync(It.IsAny<IEnumerable<TicketDetail>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.EventRepository.UpdateAsync(It.IsAny<Event>()))
                .ReturnsAsync((Event b) => b);
            _unitOfWorkMock.Setup(u => u.WalletRepository.UpdateRangeAsync(It.IsAny<IEnumerable<Wallet>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);
            _unitOfWorkMock.Setup(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // ===== Mock TransactionHelper =====
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Mock Services =====
            _ticketTokenServiceMock.Setup(s => s.CreateTicketToken(It.IsAny<Guid>()))
                .Returns<Guid>(id => $"QR_TOKEN_{id}");

            _qrCodeServiceMock.Setup(s => s.GenerateQrBytesAndUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync((List<string> contents) =>
                {
                    var bytes = contents.ToDictionary(c => c, c => new byte[] { 1, 2, 3 });
                    var urls = contents.ToDictionary(c => c, c => $"https://example.com/{c}.png");
                    return (bytes, urls);
                });

            _pdfServiceMock.Setup(s => s.GenerateTicketsPdfAsync(
                    It.IsAny<List<TicketForPdf>>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ReturnsAsync(new byte[10]);

            _emailServiceMock.Setup(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.True(result.IsSuccess, "Booking should succeed when wallet has enough balance.");

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.TicketRepository.AddRangeAsync(It.IsAny<IEnumerable<Ticket>>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.AtLeastOnce);

            _emailServiceMock.Verify(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task UTCID02_CreateBookingAsync_ShouldReturnSuccess_WhenFreeTickets()
        {
            // ===== Arrange =====
            var userId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var eventId = Guid.Parse("e4b9a2c1-5f6d-42f1-9678-75c7f6e2b9f2");
            var ticketTypeId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Free User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "123 ABC",
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
                Title = "AIEvent Free Edition",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 50,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Free event for testing"
            };

            var freeTicket = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "Free Pass",
                TicketPrice = 0,
                RemainingQuantity = 50,
                SoldQuantity = 0,
                TicketQuantity = 50
            };

            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 500 };
            var walletOrg = new Wallet { Id = Guid.NewGuid(), UserId = organizerId, Balance = 200 };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 2 }
        }
            };

            // ===== Mock Queryables =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMock());

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { freeTicket }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);

            // ===== Mock Async Actions =====
            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);
            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<IEnumerable<Ticket>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.EventRepository.UpdateAsync(It.IsAny<Event>()))
                .ReturnsAsync((Event e) => e);
            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.UpdateRangeAsync(It.IsAny<IEnumerable<TicketDetail>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);


            // ===== Mock Transaction Helper =====
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Mock Services =====
            _ticketTokenServiceMock.Setup(s => s.CreateTicketToken(It.IsAny<Guid>()))
                .Returns<Guid>(id => $"FREE_TOKEN_{id}");

            _qrCodeServiceMock.Setup(s => s.GenerateQrBytesAndUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync((List<string> contents) =>
                {
                    var bytes = contents.ToDictionary(c => c, c => new byte[] { 1, 2, 3 });
                    var urls = contents.ToDictionary(c => c, c => $"https://example.com/{c}.png");
                    return (bytes, urls);
                });

            _pdfServiceMock.Setup(s => s.GenerateTicketsPdfAsync(
                It.IsAny<List<TicketForPdf>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .ReturnsAsync(new byte[10]);

            _emailServiceMock.Setup(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.True(result.IsSuccess, "Booking should succeed for free tickets.");

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.TicketRepository.AddRangeAsync(It.IsAny<IEnumerable<Ticket>>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.AtLeastOnce);

            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);

            _emailServiceMock.Verify(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task UTCID03_CreateBookingAsync_ShouldReturnError_WhenUserNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid(); 
            var organizerId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var ticketTypeId = Guid.NewGuid();

            // Chỉ tạo dữ liệu event, ticket... nhưng KHÔNG có user nào trong UserRepository
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Description = "Test",
            };

            var ticketType = new TicketDetail
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
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 1 }
        }
            };

            // ===== Mock Queryable Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User>() // ❌ Không có user nào
                    .AsQueryable()
                    .BuildMockDbSet()
                    .Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            // ===== Mock TransactionHelper =====
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess, "Booking should fail when user does not exist.");
            Assert.Equal("User not found", result.Error!.Message);

            // Đảm bảo không gọi đến AddAsync Booking hay SaveChangesAsync
            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID04_CreateBookingAsync_ShouldReturnNotFound_WhenUserIsDeleted()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var ticketTypeId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Inactive User",
                Email = "inactive@test.com",
                IsDeleted = true,
                IsActive = false
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Sample Event",
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100,
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 1 }
        }
            };

            // ===== Mock Queryable Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMock());

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            // Không cần mock wallet vì code sẽ return sớm trước khi đến đó
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet>().AsQueryable().BuildMockDbSet().Object);

            // ===== Mock TransactionHelper =====
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess, "Booking should fail when user is deleted or inactive.");
            Assert.Equal(ErrorCodes.NotFound, result.Error!.StatusCode);
            Assert.Equal("User not found", result.Error.Message);

            // Đảm bảo không có hành động tạo booking nào xảy ra
            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
            _emailServiceMock.Verify(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task UTCID05_CreateBookingAsync_ShouldReturnError_WhenEventIdNotFound()
        {
            // ===== Arrange =====
            var userId = Guid.Parse("a0a4d2a7-7b5a-4a77-90b0-0f7c71234a50");
            var organizerId = Guid.Parse("f2c8e66b-54ad-4b16-8ad2-2e2d7c35e9cb");
            var eventId_NotFound = Guid.Parse("b3c2c2a4-9e7f-4f1c-901d-2e75d07b8a20"); // Không tồn tại
            var ticketTypeId = Guid.Parse("c4c6a2a9-bb8d-41ee-94b2-8a9f4c890bde");

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
                ContactEmail = "test@gmail.com",
                ContactName = "Test",
                ContactPhone = "1234567890",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            // Không có Event nào được mock trả về
            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event>().AsQueryable().BuildMockDbSet().Object);

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100,
            };

            var walletUser = new Wallet
            {
                Id = Guid.Parse("d8f3d4e4-4e4f-412e-97b2-cf1234de8e98"),
                UserId = userId,
                Balance = 1000
            };

            var walletOrg = new Wallet
            {
                Id = Guid.Parse("e7c5a3a9-2d2a-4b9a-b6ab-f8a49d8e2341"),
                UserId = organizerId,
                Balance = 500
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId_NotFound,
                TicketTypeRequests = new List<TicketTypeRequest>
                {
                    new TicketTypeRequest
                    {
                        TicketTypeId = ticketTypeId,
                        Quantity = 1
                    }
                }
            };

            // ===== Mock các repository khác =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);

            // Mock TransactionHelper
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess);
            Assert.Equal("Event not found", result.Error!.Message);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID06_CreateBookingAsync_ShouldReturnError_WhenEventNotApproved()
        {
            // ===== Arrange =====
            var userId = Guid.Parse("c2a9f5a4-5c77-4e0a-b3a8-11ef2b2f7d8a");
            var organizerId = Guid.Parse("e4b9a2c1-5f6d-42f1-9678-75c7f6e2b9f2");
            var eventId = Guid.Parse("b6c3d2a7-3b4a-41f8-94b8-1a3b72e5a7a1");
            var ticketTypeId = Guid.Parse("f7b3e6a9-1b2e-42ab-9d6f-22d5f6a3b8c1");

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
                Address = "ABC Street",
                ContactEmail = "contact@test.com",
                ContactName = "Test Organizer",
                ContactPhone = "0123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            // Event chưa được duyệt
            var eventEntity = new Event
            {
                Id = eventId,
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-1),
                SaleEndTime = DateTime.UtcNow.AddDays(1),
                Publish = true,
                RequireApproval = ConfirmStatus.NeedConfirm,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Test event not approved yet"
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP Ticket",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var walletUser = new Wallet
            {
                Id = Guid.Parse("a6f8d7b2-4c77-48a4-9b8a-64f2b1c3e5f1"),
                UserId = userId,
                Balance = 500
            };

            var walletOrg = new Wallet
            {
                Id = Guid.Parse("b2c3d4e5-6f78-49a1-8b2c-11f3a2b7e8c2"),
                UserId = organizerId,
                Balance = 500
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 1 }
        }
            };

            // ===== Mock Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess);
            Assert.Equal("Event not found", result.Error!.Message);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID07_CreateBookingAsync_ShouldReturnError_WhenSaleEndTimeHasPassed()
        {
            // ===== Arrange =====
            var userId = Guid.Parse("f4c8e2a9-3b7a-4f11-9a6d-7d4a1b2c8e99");
            var organizerId = Guid.Parse("b2e9d1a1-4a8c-46d8-b7c4-3f9b1e2a7d11");
            var eventId = Guid.Parse("a7b9e1f4-1d6b-4a4a-9b2d-6e8f7c3a1b45");
            var ticketTypeId = Guid.Parse("e1d4c6b7-9f8a-49b5-92e4-c3b2a7d8e4f2");

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
                Address = "123 Main St",
                ContactEmail = "organizer@test.com",
                ContactName = "Organizer",
                ContactPhone = "0123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            // Sự kiện đã kết thúc thời gian bán vé
            var eventEntity = new Event
            {
                Id = eventId,
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(2),
                SaleStartTime = DateTime.UtcNow.AddDays(-10),
                SaleEndTime = DateTime.UtcNow.AddDays(-1), // Đã quá hạn bán vé
                Publish = true,
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 50,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Expired sale event"
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "Standard",
                TicketPrice = 100,
                RemainingQuantity = 50,
                SoldQuantity = 0,
                TicketQuantity = 50
            };

            var walletUser = new Wallet
            {
                Id = Guid.Parse("d9a8c7b6-1e2f-4a3b-9d1a-5b6c7e8f9a10"),
                UserId = userId,
                Balance = 1000
            };

            var walletOrg = new Wallet
            {
                Id = Guid.Parse("f2e3d4c5-6b7a-8a9b-9c1d-2e3f4a5b6c7d"),
                UserId = organizerId,
                Balance = 500
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest
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

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess);
            Assert.Equal("Ticket sales period has passed or not yet come", result.Error!.Message);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID08_CreateBookingAsync_ShouldReturnError_WhenSaleNotStartedYet()
        {
            // ===== Arrange =====
            var userId = Guid.Parse("9f1e2d3c-4b5a-6c7d-8e9f-1a2b3c4d5e6f");
            var organizerId = Guid.Parse("2a3b4c5d-6e7f-8a9b-1c2d-3e4f5a6b7c8d");
            var eventId = Guid.Parse("6d7c8b9a-0f1e-2d3c-4b5a-6c7d8e9f0a1b");
            var ticketTypeId = Guid.Parse("1a2b3c4d-5e6f-7a8b-9c1d-2e3f4a5b6c7d");

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
                Address = "123 Main St",
                ContactEmail = "organizer@test.com",
                ContactName = "Organizer",
                ContactPhone = "0123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            // Sự kiện CHƯA ĐẾN thời gian bán vé
            var eventEntity = new Event
            {
                Id = eventId,
                Title = "AIEvent 2025",
                StartTime = DateTime.UtcNow.AddDays(5),
                EndTime = DateTime.UtcNow.AddDays(6),
                SaleStartTime = DateTime.UtcNow.AddDays(2), // CHƯA TỚI THỜI GIAN BÁN
                SaleEndTime = DateTime.UtcNow.AddDays(4),
                Publish = true,
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Upcoming sale event"
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100
            };

            var walletUser = new Wallet
            {
                Id = Guid.Parse("a1b2c3d4-e5f6-7a8b-9c1d-2e3f4a5b6c7d"),
                UserId = userId,
                Balance = 1000
            };

            var walletOrg = new Wallet
            {
                Id = Guid.Parse("d1e2f3a4-b5c6-7d8e-9f1a-2b3c4d5e6f7a"),
                UserId = organizerId,
                Balance = 500
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest
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

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess);
            Assert.Equal("Ticket sales period has passed or not yet come", result.Error!.Message);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID09_CreateBookingAsync_ShouldReturnError_WhenOneOrMoreTicketTypesInvalid()
        {
            // ===== Arrange =====
            var userId = Guid.Parse("11111111-2222-3333-4444-555555555555");
            var organizerId = Guid.Parse("66666666-7777-8888-9999-000000000000");
            var eventId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
            var validTicketTypeId = Guid.Parse("99999999-aaaa-bbbb-cccc-dddddddddddd");
            var invalidTicketTypeId = Guid.Parse("12345678-90ab-cdef-1234-567890abcdef");

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
                Address = "123 Organizer Street",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Name",
                ContactPhone = "0123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Description"
            };

            // Chỉ có 1 TicketType tồn tại trong DB (validTicketTypeId)
            var existingTicketType = new TicketDetail
            {
                Id = validTicketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 50,
                SoldQuantity = 0,
                TicketQuantity = 50
            };

            // Wallets
            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 1000 };
            var walletOrg = new Wallet { Id = Guid.NewGuid(), UserId = organizerId, Balance = 500 };

            // Request chứa 2 ticket types (1 valid, 1 invalid)
            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
                {
                    new TicketTypeRequest { TicketTypeId = validTicketTypeId, Quantity = 1 },
                    new TicketTypeRequest { TicketTypeId = invalidTicketTypeId, Quantity = 1 } // không tồn tại trong DB
                }
            };

            // ===== Mock Queryable Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            // Chỉ có 1 ticket type hợp lệ trong DB
            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { existingTicketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);

            // Transaction helper: cho phép chạy trực tiếp logic trong transaction
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess);
            Assert.Equal("One or more ticket types are invalid", result.Error!.Message);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID10_CreateBookingAsync_ShouldReturnError_WhenNotEnoughTicketsForType()
        {
            // Arrange
            var userId = Guid.Parse("11111111-2222-3333-4444-555555555555");
            var organizerId = Guid.Parse("66666666-7777-8888-9999-000000000000");
            var eventId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
            var ticketTypeId = Guid.Parse("99999999-aaaa-bbbb-cccc-dddddddddddd");

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
                Address = "123 Organizer Street",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Name",
                ContactPhone = "0123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
                User = new User
                {
                    Id = organizerId,
                    FullName = "Organizer",
                    Email = "org@test.com",
                    IsActive = true,
                    IsDeleted = false
                }
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Description"
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP Ticket",
                TicketPrice = 200,
                RemainingQuantity = 1, // ❌ chỉ còn 1 vé
                TicketQuantity = 50,
                SoldQuantity = 49,
                EventId = eventEntity.Id,
                Event = eventEntity
            };

            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 5000 };
            var walletOrg = new Wallet { Id = Guid.NewGuid(), UserId = organizerId, Balance = 1000 };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
                {
                    new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 2 }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.BookingRepository.Query(false))
                .Returns(new List<Booking>().AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.BookingItemRepository.Query(false))
                .Returns(new List<BookingItem>().AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.TicketRepository.Query(false))
                .Returns(new List<Ticket>().AsQueryable().BuildMockDbSet().Object);

            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .ReturnsAsync(Result.Failure(ErrorResponse.FailureResult("Not enough tickets for type VIP Ticket")));

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Not enough tickets for type VIP Ticket", result.Error!.Message);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID11_CreateBookingAsync_ShouldReturnError_WhenNotEnoughMoneyInWallet()
        {
            // Arrange
            var userId = Guid.Parse("11111111-2222-3333-4444-555555555555");
            var organizerId = Guid.Parse("66666666-7777-8888-9999-000000000000");
            var eventId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
            var ticketTypeId = Guid.Parse("99999999-aaaa-bbbb-cccc-dddddddddddd");

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsActive = true,
                IsDeleted = false
            };

            var organizerUser = new User
            {
                Id = organizerId,
                FullName = "Organizer",
                Email = "org@test.com",
                IsActive = true,
                IsDeleted = false
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = organizerId,
                UserId = organizerId,
                Address = "123 Organizer Street",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Name",
                ContactPhone = "0123456789",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
                User = organizerUser
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Description = "Test"
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 1000,
                RemainingQuantity = 10,
                EventId = eventId,
                Event = eventEntity,
                TicketQuantity = 10,
                SoldQuantity = 0
            };

            var walletUser = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 500 };
            var walletOrg = new Wallet { Id = Guid.NewGuid(), UserId = organizerId, Balance = 1000 };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 1 }
        }
            };

            // Mock repositories
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user, organizerUser }.AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser, walletOrg }.AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.BookingRepository.Query(false))
                .Returns(new List<Booking>().AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.BookingItemRepository.Query(false))
                .Returns(new List<BookingItem>().AsQueryable().BuildMockDbSet().Object);
            _unitOfWorkMock.Setup(u => u.TicketRepository.Query(false))
                .Returns(new List<Ticket>().AsQueryable().BuildMockDbSet().Object);

            // Mock transaction helper
            _transactionHelperMock
                .Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .ReturnsAsync(Result.Failure(ErrorResponse.FailureResult("Not enough money in wallet")));

            // Act
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Not enough money in wallet", result.Error!.Message);

            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task UTCID12_CreateBookingAsync_ShouldReturnNotFound_WhenUserIsInactive()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var ticketTypeId = Guid.NewGuid();

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
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Sample Event",
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100,
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 1 }
        }
            };

            // ===== Mock Queryable Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMock());

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            // Không cần mock wallet vì code sẽ return sớm trước khi đến đó
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet>().AsQueryable().BuildMockDbSet().Object);

            // ===== Mock TransactionHelper =====
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess, "Booking should fail when user is deleted or inactive.");
            Assert.Equal(ErrorCodes.NotFound, result.Error!.StatusCode);
            Assert.Equal("User not found", result.Error.Message);

            // Đảm bảo không có hành động tạo booking nào xảy ra
            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
            _emailServiceMock.Verify(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task UTCID13_CreateBookingAsync_ShouldReturnNotFound_WhenWalletUserNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var ticketTypeId = Guid.NewGuid();

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
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Sample Event",
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100,
            };

            // 🧨 Chỉ tạo wallet cho organizer, KHÔNG có wallet của user
            var walletOrg = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = organizerId,
                Balance = 1000,
                IsDeleted = false
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 2 }
        }
            };

            // ===== Mock Queryable Repositories =====
            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMock());

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            // ⚠️ Wallet thiếu của user
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletOrg }.AsQueryable().BuildMockDbSet().Object);

            // ===== Mock Async Repository Actions =====
            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);
            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<IEnumerable<Ticket>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.UpdateRangeAsync(It.IsAny<IEnumerable<TicketDetail>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.EventRepository.UpdateAsync(It.IsAny<Event>()))
                .ReturnsAsync((Event b) => b);
            _unitOfWorkMock.Setup(u => u.WalletRepository.UpdateRangeAsync(It.IsAny<IEnumerable<Wallet>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);
            _unitOfWorkMock.Setup(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            // ===== Mock TransactionHelper =====
            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            // ===== Mock Services =====
            _ticketTokenServiceMock.Setup(s => s.CreateTicketToken(It.IsAny<Guid>()))
                .Returns<Guid>(id => $"QR_TOKEN_{id}");

            _qrCodeServiceMock.Setup(s => s.GenerateQrBytesAndUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync((List<string> contents) =>
                {
                    var bytes = contents.ToDictionary(c => c, c => new byte[] { 1, 2, 3 });
                    var urls = contents.ToDictionary(c => c, c => $"https://example.com/{c}.png");
                    return (bytes, urls);
                });

            _pdfServiceMock.Setup(s => s.GenerateTicketsPdfAsync(
                    It.IsAny<List<TicketForPdf>>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ReturnsAsync(new byte[10]);

            _emailServiceMock.Setup(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess, "Booking should fail when user wallet not found.");
            Assert.Equal(ErrorCodes.NotFound, result.Error!.StatusCode);
            Assert.Equal("Wallet user not found", result.Error.Message);

            // Đảm bảo transaction không tạo payment
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Never);
            _emailServiceMock.Verify(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task UTCID14_CreateBookingAsync_ShouldReturnNotFound_WhenOrganizerProfileIsNull()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var ticketTypeId = Guid.NewGuid();
             
            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = null, 
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Sample Event",
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "Standard",
                TicketPrice = 100,
                RemainingQuantity = 50,
                SoldQuantity = 0,
                TicketQuantity = 50
            };

            var walletUser = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 500,
                IsDeleted = false
            };

            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
        {
            new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 1 }
        }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user }.AsQueryable().BuildMock());

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _ticketTokenServiceMock.Setup(s => s.CreateTicketToken(It.IsAny<Guid>()))
                .Returns<Guid>(id => $"QR_TOKEN_{id}");

            _qrCodeServiceMock.Setup(s => s.GenerateQrBytesAndUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync((List<string> contents) =>
                {
                    var bytes = contents.ToDictionary(c => c, c => new byte[] { 1, 2, 3 });
                    var urls = contents.ToDictionary(c => c, c => $"https://example.com/{c}.png");
                    return (bytes, urls);
                });

            // ===== Act =====
            var result = await _bookingService.CreateBookingAsync(userId, request);

            // ===== Assert =====
            Assert.False(result.IsSuccess, "Booking should fail when OrganizerProfile is null.");
            Assert.Equal(ErrorCodes.NotFound, result.Error!.StatusCode);
            Assert.Equal("Organizer not found", result.Error.Message);

            // Đảm bảo không có thao tác ghi dữ liệu
            _unitOfWorkMock.Verify(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);
            _emailServiceMock.Verify(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task UTCID15_CreateBookingAsync_ShouldReturnNotFound_WhenOrganizerWalletNotFound()
        {
            var userId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();
            var eventId = Guid.NewGuid();
            var ticketTypeId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
                Email = "user@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizer = new User
            {
                Id = organizerId,
                FullName = "Organizer User",
                Email = "organizer@test.com",
                IsDeleted = false,
                IsActive = true
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = organizer.Id,
                User = organizer,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
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
                RequireApproval = ConfirmStatus.Approve,
                OrganizerProfile = organizerProfile,
                OrganizerProfileId = organizerProfile.Id,
                RemainingTickets = 100,
                SoldQuantity = 0,
                Address = "123 Main St",
                Description = "Sample Event",
            };

            var ticketType = new TicketDetail
            {
                Id = ticketTypeId,
                TicketName = "VIP",
                TicketPrice = 100,
                RemainingQuantity = 100,
                SoldQuantity = 0,
                TicketQuantity = 100,
                EventId = eventId
            };

            var walletUser = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 1000,
                IsDeleted = false
            };

            user.Wallet = walletUser;

            // ❌ Không tạo wallet cho organizer
            var request = new CreateBookingRequest
            {
                EventId = eventId,
                TicketTypeRequests = new List<TicketTypeRequest>
                {
                    new TicketTypeRequest { TicketTypeId = ticketTypeId, Quantity = 2 }
                }
            };

            _unitOfWorkMock.Setup(u => u.UserRepository.Query(false))
                .Returns(new List<User> { user, organizer }.AsQueryable().BuildMock());

            _unitOfWorkMock.Setup(u => u.EventRepository.Query(false))
                .Returns(new List<Event> { eventEntity }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.Query(false))
                .Returns(new List<TicketDetail> { ticketType }.AsQueryable().BuildMockDbSet().Object);

            // ⚠️ Chỉ có wallet user, không có wallet organizer
            _unitOfWorkMock.Setup(u => u.WalletRepository.Query(false))
                .Returns(new List<Wallet> { walletUser }.AsQueryable().BuildMockDbSet().Object);

            _unitOfWorkMock.Setup(u => u.BookingRepository.AddAsync(It.IsAny<Booking>()))
                .ReturnsAsync((Booking b) => b);
            _unitOfWorkMock.Setup(u => u.BookingItemRepository.AddRangeAsync(It.IsAny<IEnumerable<BookingItem>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.TicketRepository.AddRangeAsync(It.IsAny<IEnumerable<Ticket>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.TicketDetailRepository.UpdateRangeAsync(It.IsAny<IEnumerable<TicketDetail>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.EventRepository.UpdateAsync(It.IsAny<Event>()))
                .ReturnsAsync((Event b) => b);
            _unitOfWorkMock.Setup(u => u.WalletRepository.UpdateRangeAsync(It.IsAny<IEnumerable<Wallet>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction b) => b);
            _unitOfWorkMock.Setup(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()))
                .Returns(Task.CompletedTask);
            _unitOfWorkMock.Setup(u => u.SaveChangesAsync())
                .ReturnsAsync(1);

            _transactionHelperMock.Setup(t => t.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(func => func());

            _ticketTokenServiceMock.Setup(s => s.CreateTicketToken(It.IsAny<Guid>()))
                .Returns<Guid>(id => $"QR_TOKEN_{id}");

            _qrCodeServiceMock.Setup(s => s.GenerateQrBytesAndUrlsAsync(It.IsAny<List<string>>()))
                .ReturnsAsync((List<string> contents) =>
                {
                    var bytes = contents.ToDictionary(c => c, c => new byte[] { 1, 2, 3 });
                    var urls = contents.ToDictionary(c => c, c => $"https://example.com/{c}.png");
                    return (bytes, urls);
                });

            _pdfServiceMock.Setup(s => s.GenerateTicketsPdfAsync(
                    It.IsAny<List<TicketForPdf>>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>()))
                .ReturnsAsync(new byte[10]);

            _emailServiceMock.Setup(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            var result = await _bookingService.CreateBookingAsync(userId, request);

            Assert.False(result.IsSuccess, "Booking should fail when organizer wallet not found.");
            Assert.Equal(ErrorCodes.NotFound, result.Error!.StatusCode);
            Assert.Equal("Wallet organizer not found", result.Error.Message);

            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Never);
            _emailServiceMock.Verify(s => s.SendTicketsEmailAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<string>()), Times.Never);
        }
        #endregion

        #region RefundticketAsync Tests
        [Fact]
        public async Task UTCID01_RefundTicketAsync_ShouldReturnFailure_WhenTicketIdIsInvalid()
        {
            var invalidTicketId = "not-a-guid"; 
            var userId = Guid.NewGuid();

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, invalidTicketId);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsSuccess);
            Assert.Equal("Invalid ticket ID format", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Never);
        }

        [Fact]
        public async Task UTCID02_RefundTicketAsync_ShouldReturnFailure_WhenTicketNotFound()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var emptyTickets = new List<Ticket>(); 
            var ticketQueryableMock = emptyTickets.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsSuccess);
            Assert.Equal("Ticket not found", result.Error!.Message);
            Assert.Equal(ErrorCodes.NotFound, result.Error.StatusCode);

            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
        }

        [Fact]
        public async Task UTCID03_RefundTicketAsync_ShouldReturnBadRequest_WhenTicketAlreadyRefunded()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Test Event",
                IsDeleted = false,
                StartTime = DateTime.UtcNow.AddDays(5),
                OrganizerProfile = organizerProfile,
                Description = "Test",
                EndTime = DateTime.UtcNow.AddDays(5)
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Test",
                RefundRuleDetails = new List<RefundRuleDetail>()
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                RefundRule = refundRule,
                TicketName = "Test",
                TicketQuantity = 1,
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                Status = TicketStatus.Refunded, 
                TicketType = ticketType,
                IsDeleted = false,
                EventName = "Test",
                QrCodeUrl = "Test",
                TicketCode = "Test",
            };

            var ticketList = new List<Ticket> { ticket };

            var ticketQueryableMock = ticketList.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsSuccess);
            Assert.Equal("Ticket has already been refunded", result.Error!.Message);
            Assert.Equal(ErrorCodes.InvalidInput, result.Error.StatusCode);

            // Verify repository được gọi đúng 1 lần
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
        }

        [Fact]
        public async Task UTCID04_RefundTicketAsync_ShouldReturnInternalServerError_WhenEventAlreadyStarted()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Test Event",
                IsDeleted = false,
                StartTime = DateTime.UtcNow.AddMinutes(-5),
                OrganizerProfile = organizerProfile,
                Description = "Test",
                EndTime = DateTime.UtcNow.AddHours(1)
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Test",
                RefundRuleDetails = new List<RefundRuleDetail>()
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                RefundRule = refundRule,
                TicketName = "Test",
                TicketQuantity = 1,
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                IsDeleted = false,
                EventName = "Test",
                QrCodeUrl = "Test",
                TicketCode = "Test",
            };

            var ticketList = new List<Ticket> { ticket };
            var ticketQueryableMock = ticketList.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            Assert.NotNull(result);
            Assert.False(result.IsSuccess);
            Assert.Equal("Cannot refund after event has started", result.Error!.Message);
            Assert.Equal(ErrorCodes.InternalServerError, result.Error.StatusCode);

            // Verify repository được gọi đúng 1 lần
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
        }

        [Fact]
        public async Task UTCID05_RefundTicketAsync_ShouldSucceed_WhenFreeEventAndEmptyRefundRuleDetails()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();
            var organizerId = Guid.NewGuid();

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Free Event",
                StartTime = DateTime.UtcNow.AddDays(3),
                EndTime = DateTime.UtcNow.AddDays(3),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                TicketType = TicketType.Free,
                Description = "test"
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Empty rule",
                RefundRuleDetails = new List<RefundRuleDetail>()
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "Free Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "Free Event",
                QrCodeUrl = "test-qr",
                TicketCode = "free001",
                Price = 0
            };

            var ticketQueryableMock = new List<Ticket> { ticket }
                .AsQueryable()
                .BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();

            ticket.Status.Should().Be(TicketStatus.Refunded);
            ticketType.RemainingQuantity.Should().Be(6);
            ticketType.SoldQuantity.Should().Be(4);
            eventEntity.RemainingTickets.Should().Be(11);
            eventEntity.SoldQuantity.Should().Be(4);

            // Verify
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Never);
        }

        [Fact]
        public async Task UTCID06_RefundTicketAsync_ShouldReturnBadRequest_WhenNoValidRefundRuleDetailFound()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Paid Event",
                StartTime = DateTime.UtcNow.AddDays(3),
                EndTime = DateTime.UtcNow.AddDays(3),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                Description = "Boundary test event",
                TicketType = TicketType.Paid
            };

            var refundRuleDetails = new List<RefundRuleDetail>
            {
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 5, 
                    MaxDaysBeforeEvent = 10,
                    RefundPercent = 50
                }
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Boundary rule",
                RefundRuleDetails = refundRuleDetails
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "Normal Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "Paid Event",
                QrCodeUrl = "test-qr",
                TicketCode = "paid001",
                Price = 100
            };

            var ticketQueryableMock = new List<Ticket> { ticket }
                .AsQueryable()
                .BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Refund rule not applicable for this time");
            result.Error.StatusCode.Should().Be(ErrorCodes.InvalidInput);

            ticket.Status.Should().Be(TicketStatus.Valid);

            // Verify
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Never);
        }

        [Fact]
        public async Task UTCID07_RefundTicketAsync_ShouldReturnNotFound_WhenUserWalletMissing()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Refundable Event",
                StartTime = DateTime.UtcNow.AddDays(7),
                EndTime = DateTime.UtcNow.AddDays(7),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                Description = "Refund test event",
                TicketType = TicketType.Paid
            };

            var refundRuleDetails = new List<RefundRuleDetail>
            {
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 5,
                    MaxDaysBeforeEvent = 10,
                    RefundPercent = 50
                }
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Valid Refund Rule",
                RefundRuleDetails = refundRuleDetails
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "Standard Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "Refundable Event",
                QrCodeUrl = "test-qr",
                TicketCode = "ticket-001",
                Price = 200
            };

            var organizerWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Balance = 1000,
                IsDeleted = false
            };

            var wallets = new List<Wallet> { organizerWallet };

            var ticketQueryableMock = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            var walletQueryableMock = wallets.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.WalletRepository.Query(false))
                .Returns(walletQueryableMock);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Wallet not found");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            ticket.Status.Should().Be(TicketStatus.Valid);

            // Verify
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Never);
        }

        [Fact]
        public async Task UTCID08_RefundTicketAsync_ShouldReturnNotFound_WhenOrganizerWalletMissing()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Refundable Event",
                StartTime = DateTime.UtcNow.AddDays(7),
                EndTime = DateTime.UtcNow.AddDays(7),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                Description = "Refund test event",
                TicketType = TicketType.Paid
            };

            var refundRuleDetails = new List<RefundRuleDetail>
            {
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 5,
                    MaxDaysBeforeEvent = 10,
                    RefundPercent = 50
                }
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Valid Refund Rule",
                RefundRuleDetails = refundRuleDetails
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "Standard Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "Refundable Event",
                QrCodeUrl = "test-qr",
                TicketCode = "ticket-001",
                Price = 200
            };

            var userWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 500,
                IsDeleted = false
            };

            // Organizer wallet bị thiếu
            var wallets = new List<Wallet> { userWallet };

            var ticketQueryableMock = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            var walletQueryableMock = wallets.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.WalletRepository.Query(false))
                .Returns(walletQueryableMock);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Wallet not found");
            result.Error.StatusCode.Should().Be(ErrorCodes.NotFound);

            ticket.Status.Should().Be(TicketStatus.Valid);

            // Verify
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Never);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Never);
        }

        [Fact]
        public async Task UTCID09_RefundTicketAsync_ShouldSucceed_WhenRefundPercentIs100()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Refundable Event",
                StartTime = DateTime.UtcNow.AddDays(7),
                EndTime = DateTime.UtcNow.AddDays(7),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                Description = "Refund test event",
                TicketType = TicketType.Paid
            };

            var refundRuleDetails = new List<RefundRuleDetail>
            {
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 5,
                    MaxDaysBeforeEvent = 10,
                    RefundPercent = 100
                }
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Full Refund Rule",
                RefundRuleDetails = refundRuleDetails
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "Standard Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                User = user,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "Refundable Event",
                QrCodeUrl = "test-qr",
                TicketCode = "ticket-001",
                Price = 200
            };

            var userWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                IsDeleted = false
            };

            var organizerWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Balance = 1000,
                IsDeleted = false
            };

            var wallets = new List<Wallet> { userWallet, organizerWallet };

            var ticketQueryableMock = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            var walletQueryableMock = wallets.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.WalletRepository.Query(false))
                .Returns(walletQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction p) => p);

            _unitOfWorkMock
                .Setup(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()))
                .Returns(Task.CompletedTask);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();

            ticket.Status.Should().Be(TicketStatus.Refunded);
            userWallet.Balance.Should().Be(200);
            organizerWallet.Balance.Should().Be(800);

            // Verify
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Once);
        }

        [Fact]
        public async Task UTCID10_RefundTicketAsync_ShouldSucceed_WhenRefundPercentIs50()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Refundable Event",
                StartTime = DateTime.UtcNow.AddDays(7),
                EndTime = DateTime.UtcNow.AddDays(7),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                Description = "Refund test event",
                TicketType = TicketType.Paid
            };

            var refundRuleDetails = new List<RefundRuleDetail>
            {
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 5,
                    MaxDaysBeforeEvent = 10,
                    RefundPercent = 50
                },
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 15,
                    MaxDaysBeforeEvent = 20,
                    RefundPercent = 80
                },
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "Half Refund Rule",
                RefundRuleDetails = refundRuleDetails
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "Standard Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                User = user,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "Refundable Event",
                QrCodeUrl = "test-qr",
                TicketCode = "ticket-001",
                Price = 200
            };

            var userWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                IsDeleted = false
            };

            var organizerWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Balance = 1000,
                IsDeleted = false
            };

            var wallets = new List<Wallet> { userWallet, organizerWallet };

            var ticketQueryableMock = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            var walletQueryableMock = wallets.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.WalletRepository.Query(false))
                .Returns(walletQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction p) => p);

            _unitOfWorkMock
                .Setup(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()))
                .Returns(Task.CompletedTask);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();

            ticket.Status.Should().Be(TicketStatus.Refunded);
            userWallet.Balance.Should().Be(100);       // 50% of 200
            organizerWallet.Balance.Should().Be(900);  // 1000 - 100

            // Verify repository được gọi đúng
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Once);
        }

        [Fact]
        public async Task UTCID11_RefundTicketAsync_ShouldSucceed_WhenRefundPercentIs0_QuantitiesUpdatedCorrectly()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Test User",
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Address = "123 Organizer St",
                ContactEmail = "org@test.com",
                ContactName = "Organizer Test",
                ContactPhone = "0987654321",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Refundable Event",
                StartTime = DateTime.UtcNow.AddDays(7),
                EndTime = DateTime.UtcNow.AddDays(7),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                Description = "Refund test event",
                TicketType = TicketType.Paid
            };

            var refundRuleDetails = new List<RefundRuleDetail>
            {
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 5,
                    MaxDaysBeforeEvent = 10,
                    RefundPercent = 0
                }
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "No Refund Rule",
                RefundRuleDetails = refundRuleDetails
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "Standard Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                User = user,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "Refundable Event",
                QrCodeUrl = "test-qr",
                TicketCode = "ticket-001",
                Price = 200
            };

            var userWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                IsDeleted = false
            };

            var organizerWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = OrgId,
                Balance = 1000,
                IsDeleted = false
            };

            var wallets = new List<Wallet> { userWallet, organizerWallet };

            var ticketQueryableMock = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            var walletQueryableMock = wallets.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.WalletRepository.Query(false))
                .Returns(walletQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction p) => p);

            _unitOfWorkMock
                .Setup(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()))
                .Returns(Task.CompletedTask);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();

            // RefundPercent = 0 => tiền không thay đổi
            userWallet.Balance.Should().Be(0);
            organizerWallet.Balance.Should().Be(1000);

            // Kiểm tra tăng giảm số lượng vé đúng
            ticket.Status.Should().Be(TicketStatus.Refunded);
            ticketType.RemainingQuantity.Should().Be(6);   // 5 + 1
            ticketType.SoldQuantity.Should().Be(4);        // 5 - 1
            eventEntity.RemainingTickets.Should().Be(11);  // 10 + 1
            eventEntity.SoldQuantity.Should().Be(4);       // 5 - 1

            // Verify repository được gọi đúng
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Once);
        }

        [Fact]
        public async Task UTCID12_RefundTicketAsync_ShouldUpdateWalletsCorrectly_WhenRefundPercentIs80()
        {
            // Arrange
            var validTicketId = Guid.NewGuid().ToString();
            var userId = Guid.NewGuid();
            var orgId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                FullName = "Test User"
            };

            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = orgId,
                Address = "456 Organizer St",
                ContactEmail = "org2@test.com",
                ContactName = "Organizer 2",
                ContactPhone = "0912345678",
                EventExperienceLevel = 0,
                EventFrequency = 0,
                EventSize = 0,
                OrganizationType = 0,
                OrganizerType = 0,
            };

            var eventEntity = new Event
            {
                Id = Guid.NewGuid(),
                Title = "High Refund Event",
                StartTime = DateTime.UtcNow.AddDays(18),  // trong khoảng 15-20 ngày => 80%
                EndTime = DateTime.UtcNow.AddDays(18),
                OrganizerProfile = organizerProfile,
                IsDeleted = false,
                RemainingTickets = 10,
                SoldQuantity = 5,
                Description = "Refund 80% test event",
                TicketType = TicketType.Paid
            };

            var refundRuleDetails = new List<RefundRuleDetail>
            {
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 5,
                    MaxDaysBeforeEvent = 10,
                    RefundPercent = 50
                },
                new RefundRuleDetail
                {
                    Id = Guid.NewGuid(),
                    MinDaysBeforeEvent = 15,
                    MaxDaysBeforeEvent = 20,
                    RefundPercent = 80
                }
            };

            var refundRule = new RefundRule
            {
                Id = Guid.NewGuid(),
                RuleName = "80% Refund Rule",
                RefundRuleDetails = refundRuleDetails
            };

            var ticketType = new TicketDetail
            {
                Id = Guid.NewGuid(),
                Event = eventEntity,
                TicketName = "VIP Ticket",
                TicketQuantity = 10,
                RemainingQuantity = 5,
                SoldQuantity = 5,
                RefundRule = refundRule,
            };

            var bookingItem = new BookingItem
            {
                Id = Guid.NewGuid(),
                BookingId = Guid.NewGuid()
            };

            var ticket = new Ticket
            {
                Id = Guid.Parse(validTicketId),
                UserId = userId,
                User = user,
                Status = TicketStatus.Valid,
                TicketType = ticketType,
                BookingItem = bookingItem,
                IsDeleted = false,
                EventName = "High Refund Event",
                QrCodeUrl = "qr-test",
                TicketCode = "ticket-002",
                Price = 300
            };

            var userWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 50,
                IsDeleted = false
            };

            var organizerWallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = orgId,
                Balance = 1200,
                IsDeleted = false
            };

            var wallets = new List<Wallet> { userWallet, organizerWallet };

            var ticketQueryableMock = new List<Ticket> { ticket }.AsQueryable().BuildMock();
            var walletQueryableMock = wallets.AsQueryable().BuildMock();

            _unitOfWorkMock
                .Setup(u => u.TicketRepository.Query(false))
                .Returns(ticketQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.WalletRepository.Query(false))
                .Returns(walletQueryableMock);

            _unitOfWorkMock
                .Setup(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()))
                .ReturnsAsync((PaymentTransaction p) => p);

            _unitOfWorkMock
                .Setup(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()))
                .Returns(Task.CompletedTask);

            _transactionHelperMock
                .Setup(th => th.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());

            // Act
            var result = await _bookingService.RefundTicketAsync(userId, validTicketId);

            // Assert
            result.Should().NotBeNull();
            result.IsSuccess.Should().BeTrue();
            result.Error.Should().BeNull();

            ticket.Status.Should().Be(TicketStatus.Refunded);

            // 80% của 300 = 240
            userWallet.Balance.Should().Be(50 + 240);
            organizerWallet.Balance.Should().Be(1200 - 240);

            // Kiểm tra tăng/giảm số lượng vé
            ticketType.RemainingQuantity.Should().Be(6);
            ticketType.SoldQuantity.Should().Be(4);

            // Verify repository calls
            _unitOfWorkMock.Verify(u => u.TicketRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletRepository.Query(false), Times.Once);
            _unitOfWorkMock.Verify(u => u.PaymentTransactionRepository.AddAsync(It.IsAny<PaymentTransaction>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.WalletTransactionRepository.AddRangeAsync(It.IsAny<IEnumerable<WalletTransaction>>()), Times.Once);
        }
        #endregion
    }
}
