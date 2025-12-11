using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Wallet;
using AIEvent.Application.Helpers;
using AIEvent.Application.Mappings;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using FluentAssertions;
using MockQueryable.Moq;
using Moq;

namespace AIEvent.Application.Test.Services
{
    public class WalletServiceTests
    {
        // Test constants
        private static readonly Guid TestUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid TestWalletId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IMapper> _mockMapper;
        private readonly IWalletService _walletService;

        public WalletServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockMapper = new Mock<IMapper>();
            
            // Setup AutoMapper configuration for ProjectTo
            var config = new MapperConfiguration(cfg => cfg.AddProfile<WalletProfile>());
            _mockMapper.Setup(m => m.ConfigurationProvider).Returns(config);
            
            _walletService = new WalletService(_mockUnitOfWork.Object, _mockMapper.Object);
        }

        #region GetWalletUser Tests

        // UTCID01: Valid userId with existing wallet - Success
        [Fact]
        public async Task UTCID01_GetWalletUser_WithValidUserId_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (userId valid, user exists, wallet exists)
            var userId = TestUserId;
            var walletId = TestWalletId;
            var balance = 100000m;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsDeleted = false
            };

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = balance,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            var walletResponse = new WalletResponse
            {
                WalletId = walletId,
                Balance = balance,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetWalletUser(userId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.WalletId.Should().Be(walletId);
            result.Value.Balance.Should().Be(balance);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
        }

        // UTCID02: Empty userId - Failure
        [Fact]
        public async Task UTCID02_GetWalletUser_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange - BV: userId = Guid.Empty (boundary value)
            var userId = Guid.Empty;

            // Act
            var result = await _walletService.GetWalletUser(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: User not found - Failure
        [Fact]
        public async Task UTCID03_GetWalletUser_WithUserNotFound_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (User is null)
            var userId = TestUserId;

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User)null!);

            // Act
            var result = await _walletService.GetWalletUser(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
        }

        // UTCID04: User is deleted - Failure
        [Fact]
        public async Task UTCID04_GetWalletUser_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (User.IsDeleted = true)
            var userId = TestUserId;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);

            // Act
            var result = await _walletService.GetWalletUser(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
        }

        // UTCID05: Wallet not found - Failure
        [Fact]
        public async Task UTCID05_GetWalletUser_WithWalletNotFound_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Wallet is null)
            var userId = TestUserId;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Wallet>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetWalletUser(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Once());
        }

        // UTCID06: Wallet with zero balance - Success
        [Fact]
        public async Task UTCID06_GetWalletUser_WithZeroBalance_ShouldReturnSuccess()
        {
            // Arrange - BV: Balance = 0 (boundary value)
            var userId = TestUserId;
            var walletId = TestWalletId;
            var balance = 0m;

            var user = new User
            {
                Id = userId,
                Email = "test@example.com",
                FullName = "Test User",
                IsDeleted = false
            };

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = balance,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>()))
                .Returns(new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetWalletUser(userId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Balance.Should().Be(0m);
        }

        #endregion

        #region GetTransactionStatustUser Tests

        // UTCID01: Valid walletId with transactions, status = All - Success
        [Fact]
        public async Task UTCID01_GetTransactionStatustUser_WithValidWalletIdAndAllStatus_ShouldReturnSuccess()
        {
            // Arrange - EP: Valid input (walletId valid, wallet exists, status = All)
            var walletId = TestWalletId;
            var userId = TestUserId;
            var status = FilterTransactionStatus.All;
            var pageNumber = 1;
            var pageSize = 5;

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = 100000m,
                IsDeleted = false
            };

            var transactions = new List<WalletTransaction>
            {
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 50000m,
                    Type = TransactionType.Topup,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.In,
                    Description = "Deposit",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    OrderCode = "ORD001",
                    PaymentUrl = null
                },
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 30000m,
                    Type = TransactionType.Payment,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.Out,
                    Description = "Payment",
                    CreatedAt = DateTimeOffset.UtcNow,
                    OrderCode = "ORD002",
                    PaymentUrl = null
                }
            };

            _mockUnitOfWork.Setup(x => x.WalletRepository.GetByIdAsync(walletId, true)).ReturnsAsync(wallet);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(transactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(2);
            result.Value!.CurrentPage.Should().Be(pageNumber);
            result.Value!.PageSize.Should().Be(pageSize);
            _mockUnitOfWork.Verify(x => x.WalletRepository.GetByIdAsync(walletId, true), Times.Once());
        }

        // UTCID02: Empty walletId - Failure
        [Fact]
        public async Task UTCID02_GetTransactionStatustUser_WithEmptyWalletId_ShouldReturnFailure()
        {
            // Arrange - BV: walletId = Guid.Empty (boundary value)
            var walletId = Guid.Empty;
            var status = FilterTransactionStatus.All;
            var pageNumber = 1;
            var pageSize = 5;

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.WalletRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: Wallet not found - Failure
        [Fact]
        public async Task UTCID03_GetTransactionStatustUser_WithWalletNotFound_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Wallet is null)
            var walletId = TestWalletId;
            var status = FilterTransactionStatus.All;
            var pageNumber = 1;
            var pageSize = 5;

            _mockUnitOfWork.Setup(x => x.WalletRepository.GetByIdAsync(walletId, true)).ReturnsAsync((Wallet)null!);

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Wallet not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.WalletRepository.GetByIdAsync(walletId, true), Times.Once());
        }

        // UTCID04: Wallet is deleted - Failure
        [Fact]
        public async Task UTCID04_GetTransactionStatustUser_WithDeletedWallet_ShouldReturnFailure()
        {
            // Arrange - EP: Invalid input (Wallet.IsDeleted = true)
            var walletId = TestWalletId;
            var userId = TestUserId;
            var status = FilterTransactionStatus.All;
            var pageNumber = 1;
            var pageSize = 5;

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = 100000m,
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.WalletRepository.GetByIdAsync(walletId, true)).ReturnsAsync(wallet);

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Wallet not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.WalletRepository.GetByIdAsync(walletId, true), Times.Once());
        }

        // UTCID05: Status = Processing (filter Pending transactions) - Success
        [Fact]
        public async Task UTCID05_GetTransactionStatustUser_WithProcessingStatus_ShouldReturnPendingTransactions()
        {
            // Arrange - EP: Valid input (status = Processing, filters Pending transactions)
            var walletId = TestWalletId;
            var userId = TestUserId;
            var status = FilterTransactionStatus.Processing;
            var pageNumber = 1;
            var pageSize = 5;

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = 100000m,
                IsDeleted = false
            };

            var transactions = new List<WalletTransaction>
            {
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 50000m,
                    Type = TransactionType.Topup,
                    Status = TransactionStatus.Pending,
                    Direction = TransactionDirection.In,
                    Description = "Pending deposit",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    OrderCode = "ORD001",
                    PaymentUrl = null
                },
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 30000m,
                    Type = TransactionType.Payment,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.Out,
                    Description = "Completed payment",
                    CreatedAt = DateTimeOffset.UtcNow,
                    OrderCode = "ORD002",
                    PaymentUrl = null
                }
            };

            _mockUnitOfWork.Setup(x => x.WalletRepository.GetByIdAsync(walletId, true)).ReturnsAsync(wallet);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(transactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.Items.First().Status.Should().Be(TransactionStatus.Pending);
            result.Value!.Items.First().Description.Should().Be("Pending deposit");
        }

        // UTCID06: No transactions - Success (empty list)
        [Fact]
        public async Task UTCID06_GetTransactionStatustUser_WithNoTransactions_ShouldReturnEmptyList()
        {
            // Arrange - EP: Valid input but no transactions exist
            var walletId = TestWalletId;
            var userId = TestUserId;
            var status = FilterTransactionStatus.All;
            var pageNumber = 1;
            var pageSize = 5;

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = 100000m,
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.WalletRepository.GetByIdAsync(walletId, true)).ReturnsAsync(wallet);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(new List<WalletTransaction>().AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
            result.Value!.CurrentPage.Should().Be(pageNumber);
            result.Value!.PageSize.Should().Be(pageSize);
        }

        // UTCID07: Pagination - pageNumber = 1, pageSize = 2 - Success
        [Fact]
        public async Task UTCID07_GetTransactionStatustUser_WithPagination_ShouldReturnCorrectPage()
        {
            // Arrange - EP: Valid input (pagination)
            var walletId = TestWalletId;
            var userId = TestUserId;
            var status = FilterTransactionStatus.All;
            var pageNumber = 1;
            var pageSize = 2;

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = 100000m,
                IsDeleted = false
            };

            var transactions = new List<WalletTransaction>
            {
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 50000m,
                    Type = TransactionType.Topup,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.In,
                    Description = "Transaction 1",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-3),
                    OrderCode = "ORD001",
                    PaymentUrl = null
                },
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 30000m,
                    Type = TransactionType.Payment,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.Out,
                    Description = "Transaction 2",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
                    OrderCode = "ORD002",
                    PaymentUrl = null
                },
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 20000m,
                    Type = TransactionType.Refund,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.In,
                    Description = "Transaction 3",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    OrderCode = "ORD003",
                    PaymentUrl = null
                }
            };

            _mockUnitOfWork.Setup(x => x.WalletRepository.GetByIdAsync(walletId, true)).ReturnsAsync(wallet);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(transactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(2);
        }

        // UTCID08: Pagination - pageNumber = 2, pageSize = 2 - Success
        [Fact]
        public async Task UTCID08_GetTransactionStatustUser_WithSecondPage_ShouldReturnCorrectPage()
        {
            // Arrange - EP: Valid input (pageNumber = 2)
            var walletId = TestWalletId;
            var userId = TestUserId;
            var status = FilterTransactionStatus.All;
            var pageNumber = 2;
            var pageSize = 2;

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = 100000m,
                IsDeleted = false
            };

            var transactions = new List<WalletTransaction>
            {
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 50000m,
                    Type = TransactionType.Topup,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.In,
                    Description = "Transaction 1",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-3),
                    OrderCode = "ORD001",
                    PaymentUrl = null
                },
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 30000m,
                    Type = TransactionType.Payment,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.Out,
                    Description = "Transaction 2",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-2),
                    OrderCode = "ORD002",
                    PaymentUrl = null
                },
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = walletId,
                    Amount = 20000m,
                    Type = TransactionType.Refund,
                    Status = TransactionStatus.Success,
                    Direction = TransactionDirection.In,
                    Description = "Transaction 3",
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
                    OrderCode = "ORD003",
                    PaymentUrl = null
                }
            };

            _mockUnitOfWork.Setup(x => x.WalletRepository.GetByIdAsync(walletId, true)).ReturnsAsync(wallet);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                .Returns(transactions.AsQueryable().BuildMockDbSet().Object);

            // Act
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value!.Items.Should().HaveCount(1);
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(2);
            result.Value!.PageSize.Should().Be(2);
        }

        #endregion
    }
}

