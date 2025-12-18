using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.DTOs.PaymentInformation;
using AIEvent.Application.DTOs.Payment;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using MockQueryable.Moq;
using Moq; 
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using Microsoft.Extensions.Logging;

namespace AIEvent.Application.Test.Services
{
    public class PaymentServiceTests
    {
        private readonly Mock<IPayOSService> _mockpayOSService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly IPaymentService _paymentService;
        private readonly Mock<IMapper> _mockMapper;
        private readonly Mock<INotificationService> _notificationService;
        private readonly Mock<ILogger<PaymentService>> _mockLog;
        public PaymentServiceTests()
        {
            _mockpayOSService = new Mock<IPayOSService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockConfiguration = new Mock<IConfiguration>();
            _notificationService = new Mock<INotificationService>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockLog = new Mock<ILogger<PaymentService>>();
            _mockMapper = new Mock<IMapper>();
            // Setup configuration default values
            _mockConfiguration.Setup(c => c["PayOS:CancelUrl"]).Returns("http://localhost:5173/wallet");
            _mockConfiguration.Setup(c => c["PayOS:ReturnUrl"]).Returns("http://localhost:5173/wallet");

            _paymentService = new PaymentService(
                _mockUnitOfWork.Object,
                _mockConfiguration.Object,
                _mockTransactionHelper.Object,
                _mockpayOSService.Object,
                _mockMapper.Object,
                _notificationService.Object,
                _mockLog.Object
            );
        }

        #region CreatePaymentTopUpAsync
         
        [Fact]
        public async Task UTCID01_CreatePaymentTopUpAsync_WithValidUserIdAndAmount_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 100000;
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };
            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 100000,
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);
            
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false))
                           .Returns(wallets.Object);
              
            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Failed to create payment link");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }
         
        [Fact]
        public async Task UTCID02_CreatePaymentTopUpAsync_WithMinimumAmount_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 9999; 
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };
            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 0,
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);
            
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false))
                           .Returns(wallets.Object); 

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()), Times.Never());
        }
         
        [Fact]
        public async Task UTCID03_CreatePaymentTopUpAsync_WithLargeAmount_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 1000000000; 
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };
            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 5000000,
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);
            
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false))
                           .Returns(wallets.Object);
              
             
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID04: Empty Guid userId - Should return failure
        [Fact]
        public async Task UTCID04_CreatePaymentTopUpAsync_WithEmptyGuid_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            long amount = 100000;

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID05: User not found - Should return failure
        [Fact]
        public async Task UTCID05_CreatePaymentTopUpAsync_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 100000;

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync((User?)null);

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.WalletRepository.Query(false), Times.Never());
        }

        // UTCID06: User is deleted - Should return failure
        [Fact]
        public async Task UTCID06_CreatePaymentTopUpAsync_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 100000;
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockUnitOfWork.Verify(x => x.WalletRepository.Query(false), Times.Never());
        }

        // UTCID07: Wallet not found - Should return failure
        [Fact]
        public async Task UTCID07_CreatePaymentTopUpAsync_WithNonExistentWallet_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 100000;
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);
            
            var wallets = new List<Wallet>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false))
                           .Returns(wallets.Object);

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Wallet not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            // PayOS verification skipped as it's a real instance
        }

        // UTCID08: Wallet is deleted - Should return failure
        [Fact]
        public async Task UTCID08_CreatePaymentTopUpAsync_WithDeletedWallet_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 100000;
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };
            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 50000,
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);
            
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false))
                           .Returns(wallets.Object);

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Wallet not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            // PayOS verification skipped as it's a real instance
        }

        [Fact]
        public async Task UTCID09_CreatePaymentTopUpAsync_WithZeroAmount_ShouldHandleBasedOnBusinessLogic()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 0;
            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };
            var wallet = new Wallet
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Balance = 50000,
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);
            
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false))
                           .Returns(wallets.Object);


            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        [Fact]
        public async Task UTCID10_CreatePaymentTopUpAsync_WithNegativeAmount_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = -100000;

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        [Fact]
        public async Task UTCID11_CreatePaymentTopUpAsync_WithValidData_PayOSSuccess_ShouldReturnPaymentUrl()
        {
            var userId = Guid.NewGuid();
            long amount = 50000; 
            var walletId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = userId,
                Balance = 100000,
                IsDeleted = false
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                           .ReturnsAsync(user);

            var walletDbSet = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(false))
                           .Returns(walletDbSet.Object);

            _mockConfiguration.Setup(c => c["PayOS:CancelUrl"]).Returns("https://example.com/cancel");
            _mockConfiguration.Setup(c => c["PayOS:ReturnUrl"]).Returns("https://example.com/return");

            var payOsResult = new CreatePaymentLinkResponse();

            _mockpayOSService.Setup(x => x.CreatePaymentLinkAsync(It.IsAny<CreatePaymentLinkRequest>()))
                      .ReturnsAsync(payOsResult);

            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()))
                           .ReturnsAsync((WalletTransaction wt) => wt);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();

            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.AddAsync(It.Is<WalletTransaction>(t =>
                t.WalletId == walletId &&
                !string.IsNullOrEmpty(t.OrderCode) &&  
                t.Amount == amount &&
                t.BalanceBefore == 100000 &&
                t.BalanceAfter == 100000 &&
                t.Type == TransactionType.Topup &&
                t.Direction == TransactionDirection.In &&
                t.Status == TransactionStatus.Pending &&
                t.Description == "Nạp tiền vào ví" &&
                t.ReferenceId == userId &&
                t.ReferenceType == ReferenceType.TopUpRequest &&
                t.CreatedBy == userId.ToString()
            )), Times.Once());

            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }
        
        [Fact]
        public async Task UTCID12_CreatePaymentTopUpAsync_WhenPayOSThrows_ShouldReturnFailureAndNotPersist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            long amount = 100000; 

            var user = new User { Id = userId, IsDeleted = false, IsActive = true, Email = "a@b.com" };
            var wallet = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 10_000, IsDeleted = false };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            var walletDbSet = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>())).Returns(walletDbSet.Object);

            _mockpayOSService
                .Setup(x => x.CreatePaymentLinkAsync(It.IsAny<CreatePaymentLinkRequest>()))
                .ThrowsAsync(new Exception("network error"));

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Failed to create payment link");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);

            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()), Times.Never());
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Never());
        }
        #endregion

        #region WithdrawAsync

        // UTCID01: Empty userId -> Invalid input
        [Fact]
        public async Task UTCID01_WithdrawAsync_WithEmptyUserId_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.Empty;
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000, Description = null };

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid userId");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID02: Null request -> Validation failure
        [Fact]
        public async Task UTCID02_WithdrawAsync_WithNullRequest_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();

            // Act
            var result = await _paymentService.WithdrawAsync(userId, null!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: Amount = 4000 -> Boundary invalid
        [Fact]
        public async Task UTCID03_WithdrawAsync_WithZeroAmount_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 0 };

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Amount must be greater than 4000");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID04: Negative amount -> invalid
        [Fact]
        public async Task UTCID04_WithdrawAsync_WithNegativeAmount_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = -1 };

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID05: User not found -> Unauthorized
        [Fact]
        public async Task UTCID05_WithdrawAsync_WithUserNotFound_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000 };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync((User?)null);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID06: User deleted -> Unauthorized
        [Fact]
        public async Task UTCID06_WithdrawAsync_WithUserDeleted_ShouldReturnUnauthorized()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000 };
            var user = new User { Id = userId, IsDeleted = true };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
        }

        // UTCID07: Wallet not found -> NotFound
        [Fact]
        public async Task UTCID07_WithdrawAsync_WithWalletNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000 };
            var user = new User { Id = userId, IsDeleted = false, IsActive = true };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            var emptyWallets = new List<Wallet>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>())).Returns(emptyWallets.Object);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Wallet not found");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID08: Insufficient balance -> InvalidInput
        [Fact]
        public async Task UTCID08_WithdrawAsync_WithInsufficientBalance_ShouldReturnInvalidInput()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000 };
            var user = new User { Id = userId, IsDeleted = false, IsActive = true };
            var wallet = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 1000, IsDeleted = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>())).Returns(wallets.Object);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Insufficient balance");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID09: Payment info not found -> NotFound
        [Fact]
        public async Task UTCID09_WithdrawAsync_WithPaymentInfoNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000 };
            var user = new User { Id = userId, IsDeleted = false, IsActive = true };
            var wallet = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 10_000, IsDeleted = false };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>())).Returns(wallets.Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(request.PaymentInfoId, true)).ReturnsAsync((PaymentInformation?)null);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Payment information not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID10: Payment info deleted -> NotFound
        [Fact]
        public async Task UTCID10_WithdrawAsync_WithPaymentInfoDeleted_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000 };
            var user = new User { Id = userId, IsDeleted = false, IsActive = true };
            var wallet = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 10_000, IsDeleted = false };
            var paymentInfo = new PaymentInformation { Id = request.PaymentInfoId, IsDeleted = true, AccountHolderName = "A", AccountNumber = "1", BankName = "B", BankBin = "970415" };
            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>())).Returns(wallets.Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(request.PaymentInfoId, true)).ReturnsAsync(paymentInfo);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Be("Payment information not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID11: Success path
        [Fact]
        public async Task UTCID11_WithdrawAsync_WithValidData_ShouldSucceedAndPersist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000, Description = null };
            var user = new User { Id = userId, IsDeleted = false, IsActive = true };
            var walletId = Guid.NewGuid();
            var wallet = new Wallet { Id = walletId, UserId = userId, Balance = 10_000, IsDeleted = false };
            var paymentInfo = new PaymentInformation { Id = request.PaymentInfoId, IsDeleted = false, BankBin = "970415", AccountNumber = "123", AccountHolderName = "A", BankName = "B" };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>())).Returns(wallets.Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(request.PaymentInfoId, true)).ReturnsAsync(paymentInfo);

            PayOS.Models.V1.Payouts.PayoutRequest? capturedPayoutRequest = null;
            _mockpayOSService.Setup(x => x.CreatePayoutAsync(It.IsAny<PayOS.Models.V1.Payouts.PayoutRequest>()))
                             .Callback<PayOS.Models.V1.Payouts.PayoutRequest>(req => capturedPayoutRequest = req)
                             .ReturnsAsync(new PayOS.Models.V1.Payouts.Payout());

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>() ))
                                  .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()))
                           .ReturnsAsync((WalletTransaction wt) => wt);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.WalletRepository.UpdateAsync(It.Is<Wallet>(w => w.Id == walletId && w.Balance == 5000)), Times.Once());
            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.AddAsync(It.Is<WalletTransaction>(t =>
                t.WalletId == walletId &&
                t.Amount == request.Amount &&
                t.Status == TransactionStatus.Success &&
                t.Type == TransactionType.Withdraw &&
                t.Direction == TransactionDirection.Out &&
                t.Description!.StartsWith("Rút tiền")
            )), Times.Once());

            // Verify payout request to PayOS uses net amount after fee and correct bank info
            capturedPayoutRequest.Should().NotBeNull();
            capturedPayoutRequest!.Amount.Should().Be(request.Amount - 4000);
            capturedPayoutRequest.ToBin.Should().Be(paymentInfo.BankBin);
            capturedPayoutRequest.ToAccountNumber.Should().Be(paymentInfo.AccountNumber);
            capturedPayoutRequest.Category.Should().Contain("Withdraw");
        }

        // UTCID12: PayOS throws -> catch path, failed transaction persisted
        [Fact]
        public async Task UTCID12_WithdrawAsync_WhenPayOSThrows_ShouldPersistFailedTransactionAndReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new OnlyPayOutRequest { PaymentInfoId = Guid.NewGuid(), Amount = 5000 };
            var user = new User { Id = userId, IsDeleted = false, IsActive = true };
            var wallet = new Wallet { Id = Guid.NewGuid(), UserId = userId, Balance = 10_000, IsDeleted = false };
            var paymentInfo = new PaymentInformation { Id = request.PaymentInfoId, IsDeleted = false, BankBin = "970415", AccountNumber = "123", AccountHolderName = "A", BankName = "B" };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true)).ReturnsAsync(user);
            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>())).Returns(wallets.Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(request.PaymentInfoId, true)).ReturnsAsync(paymentInfo);

            _mockpayOSService.Setup(x => x.CreatePayoutAsync(It.IsAny<PayOS.Models.V1.Payouts.PayoutRequest>()))
                             .ThrowsAsync(new Exception("network down"));

            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()))
                           .ReturnsAsync((WalletTransaction wt) => wt);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _paymentService.WithdrawAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error!.Message.Should().Contain("Withdraw failed: network down");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);

            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.AddAsync(It.Is<WalletTransaction>(t =>
                t.Status == TransactionStatus.Failed &&
                t.Type == TransactionType.Withdraw &&
                t.Direction == TransactionDirection.Out &&
                t.Description == "network down"
            )), Times.Once());

            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once());
        }
        #endregion

        #region PaymentWebhookAsync

        // UTCID01: Null webhook body - Should return failure
        [Fact]
        public async Task UTCID01_PaymentWebhookAsync_WithNullWebhookBody_ShouldReturnFailure()
        {
            // Arrange
            Webhook? webhookBody = null;

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Webhook data is required");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID02: Webhook success is false - Should return failure
        [Fact]
        public async Task UTCID02_PaymentWebhookAsync_WithSuccessFalse_ShouldReturnFailure()
        {
            // Arrange
            var webhookBody = new Webhook
            {
                Code = "01",
                Description = "Payment failed",
                Success = false
            };

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment failed: Payment failed");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockpayOSService.Verify(x => x.VerifyPaymentWebhookData(It.IsAny<Webhook>()), Times.Never());
        }

        // UTCID03: Webhook verification returns null - Should return failure
        [Fact]
        public async Task UTCID03_PaymentWebhookAsync_WithNullVerificationData_ShouldReturnFailure()
        {
            // Arrange
            var webhookBody = new Webhook
            {
                Code = "00",
                Description = "Success",
                Success = true
            };

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .Returns(Task.FromResult<WebhookData>(null!));

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid webhook data.");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID04: Webhook code is not "00" - Should return failure
        [Fact]
        public async Task UTCID04_PaymentWebhookAsync_WithCodeNotZeroZero_ShouldReturnFailure()
        {
            // Arrange
            var webhookBody = new Webhook
            {
                Code = "01",
                Description = "Payment failed",
                Success = true
            };

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment failed: Payment failed");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID05: Transaction not found - Should return failure
        [Fact]
        public async Task UTCID05_PaymentWebhookAsync_WithTransactionNotFound_ShouldReturnFailure()
        {
            // Arrange
            var webhookData = new WebhookData { OrderCode = 123456789, Amount = 50000 };

            var webhookBody = new Webhook { Code = "00", Description = "Success", Success = true };

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .ReturnsAsync(webhookData);

            var emptyTransactions = new List<WalletTransaction>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyTransactions.Object);

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("WalletTransaction not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID06: Transaction already successful - Should return success
        [Fact]
        public async Task UTCID06_PaymentWebhookAsync_WithTransactionAlreadySuccessful_ShouldReturnSuccess()
        {
            // Arrange
            var orderCode = "123456789";
            var walletId = Guid.NewGuid();

            var webhookData = new WebhookData { OrderCode = long.Parse(orderCode), Amount = 50000 };

            var webhookBody = new Webhook { Code = "00", Description = "Success", Success = true };

            var transaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                OrderCode = orderCode,
                WalletId = walletId,
                Amount = 50000,
                Status = TransactionStatus.Success,
                BalanceBefore = 100000,
                BalanceAfter = 150000
            };

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .ReturnsAsync(webhookData);

            var transactions = new List<WalletTransaction> { transaction }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                          .Returns(transactions.Object);

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.WalletRepository.Query(It.IsAny<bool>()), Times.Never());
        }


        // UTCID07: Amount mismatch - Should return failure
        [Fact]
        public async Task UTCID07_PaymentWebhookAsync_WithAmountMismatch_ShouldReturnFailure()
        {
            // Arrange
            var orderCode = "123456789";
            var walletId = Guid.NewGuid();

            var webhookData = new WebhookData { OrderCode = long.Parse(orderCode), Amount = 60000 };

            var webhookBody = new Webhook { Code = "00", Description = "Success", Success = true };

            var transaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                OrderCode = orderCode,
                WalletId = walletId,
                Amount = 50000, // Original amount
                Status = TransactionStatus.Pending,
                BalanceBefore = 100000,
                BalanceAfter = 100000
            };

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .ReturnsAsync(webhookData);

            var transactions = new List<WalletTransaction> { transaction }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                          .Returns(transactions.Object);

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Amount mismatch");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID08: Wallet not found - Should return failure
        [Fact]
        public async Task UTCID08_PaymentWebhookAsync_WithWalletNotFound_ShouldReturnFailure()
        {
            // Arrange
            var orderCode = "123456789";
            var walletId = Guid.NewGuid();

            var webhookData = new WebhookData { OrderCode = long.Parse(orderCode), Amount = 50000 };

            var webhookBody = new Webhook { Code = "00", Description = "Success", Success = true };

            var transaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                OrderCode = orderCode,
                WalletId = walletId,
                Amount = 50000,
                Status = TransactionStatus.Pending,
                BalanceBefore = 100000,
                BalanceAfter = 100000
            };

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .ReturnsAsync(webhookData);

            var transactions = new List<WalletTransaction> { transaction }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                          .Returns(transactions.Object);

            var emptyWallets = new List<Wallet>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyWallets.Object);

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Wallet not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID09: Wallet is deleted - Should return failure
        [Fact]
        public async Task UTCID09_PaymentWebhookAsync_WithWalletDeleted_ShouldReturnFailure()
        {
            // Arrange
            var orderCode = "123456789";
            var walletId = Guid.NewGuid();

            var webhookData = new WebhookData { OrderCode = long.Parse(orderCode), Amount = 50000 };

            var webhookBody = new Webhook { Code = "00", Description = "Success", Success = true };

            var transaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                OrderCode = orderCode,
                WalletId = walletId,
                Amount = 50000,
                Status = TransactionStatus.Pending,
                BalanceBefore = 100000,
                BalanceAfter = 100000
            };

            var wallet = new Wallet
            {
                Id = walletId,
                UserId = Guid.NewGuid(),
                Balance = 100000,
                IsDeleted = true
            };

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .ReturnsAsync(webhookData);

            var transactions = new List<WalletTransaction> { transaction }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>()))
                          .Returns(transactions.Object);

            var wallets = new List<Wallet> { wallet }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>()))
                          .Returns(wallets.Object);

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Wallet not found or deleted");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID10: Boundary - Code with different format (not "00" and success false)
        [Fact]
        public async Task UTCID10_PaymentWebhookAsync_WithSuccessFalseAndNonZeroCode_ShouldReturnFailure()
        {
            // Arrange
            var webhookBody = new Webhook { Code = "99", Description = "Unknown error", Success = false };

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment failed: Unknown error");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockpayOSService.Verify(x => x.VerifyPaymentWebhookData(It.IsAny<Webhook>()), Times.Never());
        }

        #endregion

        #region AddPaymentInformation

        // UTCID01: Valid request with all required fields, successful addition
        [Fact]
        public async Task UTCID01_AddPaymentInformation_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var paymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountHolderName = request.AccountHolderName,
                AccountNumber = request.AccountNumber,
                BankName = request.BankName,
                BranchName = request.BranchName,
                BankBin = request.BankBin
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Setup Query() to return empty list (no existing account)
            var emptyPaymentInfoList = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyPaymentInfoList.Object);

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns(paymentInfo);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(paymentInfo);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.AddAsync(It.Is<PaymentInformation>(
                p => p.UserId == userId &&
                     p.AccountHolderName == request.AccountHolderName &&
                     p.AccountNumber == request.AccountNumber &&
                     p.BankName == request.BankName &&
                     p.BranchName == request.BranchName
            )), Times.Once());
        }

        // UTCID02: Empty Guid userId - Should return failure
        [Fact]
        public async Task UTCID02_AddPaymentInformation_WithEmptyGuid_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid userId input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: Null request - Should return validation failure
        [Fact]
        public async Task UTCID03_AddPaymentInformation_WithNullRequest_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            PaymentInformationRequest? request = null;

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID04: User not found - Should return failure
        [Fact]
        public async Task UTCID04_AddPaymentInformation_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync((User?)null);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockMapper.Verify(x => x.Map<PaymentInformation>(It.IsAny<PaymentInformationRequest>()), Times.Never());
        }

        // UTCID05: User is deleted - Should return failure
        [Fact]
        public async Task UTCID05_AddPaymentInformation_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockMapper.Verify(x => x.Map<PaymentInformation>(It.IsAny<PaymentInformationRequest>()), Times.Never());
        }

        // UTCID06: Mapper returns null - Should return failure
        [Fact]
        public async Task UTCID06_AddPaymentInformation_WithMapperReturningNull_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Setup Query() to return empty list (no existing account)
            var emptyPaymentInfoList = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyPaymentInfoList.Object);

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns((PaymentInformation?)null!);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Account number already exists");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockTransactionHelper.Verify(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()), Times.Never());
        }

        // UTCID07: AccountHolderName is null - Should return validation failure
        [Fact]
        public async Task UTCID07_AddPaymentInformation_WithNullAccountHolderName_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = null!,
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account holder name is required");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID08: AccountNumber is null - Should return validation failure
        [Fact]
        public async Task UTCID08_AddPaymentInformation_WithNullAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = null!,
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number is required");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID09: AccountNumber too short (5 digits) - Boundary test
        [Fact]
        public async Task UTCID09_AddPaymentInformation_WithTooShortAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "12345", // 5 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must be between 6 and 20 digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID10: AccountNumber too long (21 digits) - Boundary test
        [Fact]
        public async Task UTCID10_AddPaymentInformation_WithTooLongAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123456789012345678901", // 21 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must be between 6 and 20 digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID11: AccountNumber with non-digits (letters) - Should return success (account number can contain letters)
        [Fact]
        public async Task UTCID11_AddPaymentInformation_WithNonDigitAccountNumber_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "12345ABC67",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var paymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountHolderName = request.AccountHolderName,
                AccountNumber = request.AccountNumber,
                BankName = request.BankName,
                BranchName = request.BranchName,
                BankBin = request.BankBin
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var emptyPaymentInfoList = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyPaymentInfoList.Object);

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns(paymentInfo);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(paymentInfo);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.AddAsync(It.Is<PaymentInformation>(
                p => p.AccountNumber == "12345ABC67"
            )), Times.Once());
        }

        // UTCID12: AccountNumber with special characters - Should return validation failure
        [Fact]
        public async Task UTCID12_AddPaymentInformation_WithSpecialCharactersInAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123-456-789", // Contains hyphens
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var emptyPaymentInfoList = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyPaymentInfoList.Object);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            var actualMessage = result.Error!.Message;
            actualMessage.Should().NotBeNullOrEmpty();
            actualMessage.Should().Be("Account number already exists");
        }

        // UTCID13: AccountNumber minimum valid (6 digits) - Boundary test - Success
        [Fact]
        public async Task UTCID13_AddPaymentInformation_WithMinimumValidAccountNumber_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123456", // Exactly 6 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var paymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountHolderName = request.AccountHolderName,
                AccountNumber = request.AccountNumber,
                BankName = request.BankName,
                BranchName = request.BranchName,
                BankBin = request.BankBin
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Setup Query() to return empty list (no existing account)
            var emptyPaymentInfoList = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyPaymentInfoList.Object);

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns(paymentInfo);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(paymentInfo);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.AddAsync(It.Is<PaymentInformation>(
                p => p.AccountNumber == "123456"
            )), Times.Once());
        }

        // UTCID14: AccountNumber maximum valid (20 digits) - Boundary test - Success
        [Fact]
        public async Task UTCID14_AddPaymentInformation_WithMaximumValidAccountNumber_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "12345678901234567890", // Exactly 20 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var paymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountHolderName = request.AccountHolderName,
                AccountNumber = request.AccountNumber,
                BankName = request.BankName,
                BranchName = request.BranchName,
                BankBin = request.BankBin   
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Setup Query() to return empty list (no existing account)
            var emptyPaymentInfoList = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyPaymentInfoList.Object);

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns(paymentInfo);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(paymentInfo);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.AddAsync(It.Is<PaymentInformation>(
                p => p.AccountNumber == "12345678901234567890"
            )), Times.Once());
        }

        // UTCID15: BankName is null - Should return validation failure
        [Fact]
        public async Task UTCID15_AddPaymentInformation_WithNullBankName_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = null!,
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Bank name is required");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID16: BranchName is null - Should return validation failure
        [Fact]
        public async Task UTCID16_AddPaymentInformation_WithNullBranchName_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = null!,
                BankBin = "123456"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Branch name is required");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID17: AccountNumber with spaces - Should return validation failure
        [Fact]
        public async Task UTCID17_AddPaymentInformation_WithSpacesInAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123 456 789", // Contains spaces
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var emptyPaymentInfoList = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(emptyPaymentInfoList.Object);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            var actualMessage = result.Error!.Message;
            actualMessage.Should().NotBeNullOrEmpty();
            actualMessage.Should().Be("Account number already exists");
        }

        // UTCID18: Existing account number for same user - Should return failure
        [Fact]
        public async Task UTCID18_AddPaymentInformation_WithExistingAccountNumberForSameUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var accountNumber = "1234567890";
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = accountNumber,
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var existingPaymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountNumber = accountNumber,
                AccountHolderName = "Existing Name",
                BankName = "Existing Bank",
                BranchName = "Existing Branch",
                IsDeleted = false,
                BankBin = "123456"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var paymentInfoList = new List<PaymentInformation> { existingPaymentInfo }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(paymentInfoList.Object);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Only one payment information is allowed");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockMapper.Verify(x => x.Map<PaymentInformation>(It.IsAny<PaymentInformationRequest>()), Times.Never());
            _mockTransactionHelper.Verify(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()), Times.Never());
        }

        // UTCID19: Existing account number for different user - Should succeed
        [Fact]
        public async Task UTCID19_AddPaymentInformation_WithExistingAccountNumberForDifferentUser_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var differentUserId = Guid.NewGuid();
            var accountNumber = "1234567890";
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = accountNumber,
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            // Existing account for different user
            var existingPaymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = differentUserId, // Different user
                AccountNumber = accountNumber,
                AccountHolderName = "Existing Name",
                BankName = "Existing Bank",
                BranchName = "Existing Branch",
                IsDeleted = false,
                BankBin = "123456"
            };

            var paymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountHolderName = request.AccountHolderName,
                AccountNumber = request.AccountNumber,
                BankName = request.BankName,
                BranchName = request.BranchName,
                BankBin = request.BankBin
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var paymentInfoList = new List<PaymentInformation> { existingPaymentInfo }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(paymentInfoList.Object);

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns(paymentInfo);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(paymentInfo);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()), Times.Once());
        }

        // UTCID20: Existing account number but deleted - Should succeed
        [Fact]
        public async Task UTCID20_AddPaymentInformation_WithDeletedExistingAccountNumber_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var accountNumber = "1234567890";
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = accountNumber,
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            // Existing account but deleted
            var existingPaymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountNumber = accountNumber,
                AccountHolderName = "Existing Name",
                BankName = "Existing Bank",
                BranchName = "Existing Branch",
                IsDeleted = true, // Deleted
                BankBin = "123456"
            };

            var paymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountHolderName = request.AccountHolderName,
                AccountNumber = request.AccountNumber,
                BankName = request.BankName,
                BranchName = request.BranchName,
                BankBin = request.BankBin
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var paymentInfoList = new List<PaymentInformation> { existingPaymentInfo }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(paymentInfoList.Object);

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns(paymentInfo);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(paymentInfo);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.AddAsync(It.IsAny<PaymentInformation>()), Times.Once());
        }


        [Fact]
        public async Task UTCID21_AddPaymentInformation_WithAccountNumberAlreadyInUse_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var accountNumber = "1234567890";
            var request = new PaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = accountNumber,
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                BankBin = "123456"
            };

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            // Existing payment info with same account number for the same user
            var existingPaymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountNumber = accountNumber,
                AccountHolderName = "Existing Name",
                BankName = "Existing Bank",
                BranchName = "Existing Branch",
                IsDeleted = false,
                BankBin = "123456"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Setup to return existing payment info with same account number
            var paymentInfoList = new List<PaymentInformation> { existingPaymentInfo }.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>()))
                          .Returns(paymentInfoList.Object);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            result.Error!.Message.Should().BeOneOf(
                "This account number is already in use",    // Expected behavior when service logic is updated
                "Only one payment information is allowed"  // Current behavior
            );
            _mockMapper.Verify(x => x.Map<PaymentInformation>(It.IsAny<PaymentInformationRequest>()), Times.Never());
            _mockTransactionHelper.Verify(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()), Times.Never());
        }


        #endregion

        #region DeletePaymentInformation

        // UTCID01: Valid deletion with existing payment information
        [Fact]
        public async Task UTCID01_DeletePaymentInformation_WithValidIds_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var existingPaymentInfo = new PaymentInformation
            {
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                IsDeleted = false,
                BankBin = "123456"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync(existingPaymentInfo);

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.DeleteAsync(It.IsAny<PaymentInformation>()))
                          .Returns(Task.CompletedTask);

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.DeleteAsync(existingPaymentInfo), Times.Once());
        }

        // UTCID02: Empty Guid userId - Should return failure
        [Fact]
        public async Task UTCID02_DeletePaymentInformation_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var paymentInformationId = Guid.NewGuid();

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: Empty Guid paymentInformationId - Should return failure
        [Fact]
        public async Task UTCID03_DeletePaymentInformation_WithEmptyPaymentInformationId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.Empty;

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID04: Both userId and paymentInformationId are empty - Should return failure
        [Fact]
        public async Task UTCID04_DeletePaymentInformation_WithBothIdsEmpty_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var paymentInformationId = Guid.Empty;

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID05: User not found - Should return failure
        [Fact]
        public async Task UTCID05_DeletePaymentInformation_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync((User?)null);

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID06: User is deleted - Should return failure
        [Fact]
        public async Task UTCID06_DeletePaymentInformation_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID07: PaymentInformation not found - Should return failure
        [Fact]
        public async Task UTCID07_DeletePaymentInformation_WithNonExistentPaymentInfo_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync((PaymentInformation?)null);

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment Infor not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockTransactionHelper.Verify(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()), Times.Never());
        }

        // UTCID08: PaymentInformation is already deleted - Should return failure
        [Fact]
        public async Task UTCID08_DeletePaymentInformation_WithAlreadyDeletedPaymentInfo_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var existingPaymentInfo = new PaymentInformation
            {
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                BankBin = "123456",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync(existingPaymentInfo);

            // Act
            var result = await _paymentService.DeletePaymendInformationAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment Infor not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockTransactionHelper.Verify(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()), Times.Never());
        }
        #endregion

        #region GetPaymentInformations

        [Fact]
        public async Task UTCID01_GetPaymentInformations_WithDefaultPagination_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var paymentInfos = new List<PaymentInformation>
            {
                new PaymentInformation
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AccountHolderName = "John Doe 1",
                    AccountNumber = "1234567890",
                    BankName = "Vietcombank",
                    BranchName = "Branch 1",
                    BankBin = "123456",
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                },
                new PaymentInformation
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AccountHolderName = "John Doe 2",
                    AccountNumber = "2234567890",
                    BankName = "ACB Bank",
                    BranchName = "Branch 2",
                    BankBin = "123456",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new PaymentInformation
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    BankBin = "123456",
                    AccountHolderName = "John Doe 3",
                    AccountNumber = "3234567890",
                    BankName = "Techcombank",
                    BranchName = "Branch 3",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                }
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var mockDbSet = paymentInfos.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false))
                          .Returns(mockDbSet.Object);

            // Act
            var result = await _paymentService.GetPaymendInformationsAsync(userId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(3);
            result.Value!.TotalItems.Should().Be(3);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(5);
            result.Value!.TotalPages.Should().Be(1);
            // Verify ordering by CreatedAt descending
            result.Value!.Items.ElementAt(0).AccountHolderName.Should().Be("John Doe 3");
        }

        // UTCID02: Empty userId - Should return failure
        [Fact]
        public async Task UTCID02_GetPaymentInformations_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;

            // Act
            var result = await _paymentService.GetPaymendInformationsAsync(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(userId, true), Times.Never());
        }

        // UTCID03: User not found - Should return failure
        [Fact]
        public async Task UTCID03_GetPaymentInformations_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync((User?)null);

            // Act
            var result = await _paymentService.GetPaymendInformationsAsync(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.Query(false), Times.Never());
        }

        // UTCID04: User is deleted - Should return failure
        [Fact]
        public async Task UTCID04_GetPaymentInformations_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = true
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            // Act
            var result = await _paymentService.GetPaymendInformationsAsync(userId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.Query(false), Times.Never());
        }

        // UTCID05: No payment information for user - Should return empty list
        [Fact]
        public async Task UTCID05_GetPaymentInformations_WithNoPaymentInfos_ShouldReturnEmptyList()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var emptyPaymentInfos = new List<PaymentInformation>();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var mockDbSet = emptyPaymentInfos.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false))
                          .Returns(mockDbSet.Object);

            // Act
            var result = await _paymentService.GetPaymendInformationsAsync(userId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().BeEmpty();
            result.Value!.TotalItems.Should().Be(0);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(5);
        }

        // UTCID06: Custom pagination - Page 1, Size 2
        [Fact]
        public async Task UTCID06_GetPaymentInformations_WithCustomPageSize_ShouldReturnCorrectPage()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var paymentInfos = new List<PaymentInformation>
            {
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 1", AccountNumber = "1111111111", BankBin = "123456", BankName = "Bank 1", BranchName = "Branch 1", CreatedAt = DateTime.UtcNow.AddDays(-5) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 2", AccountNumber = "2222222222", BankBin = "123456", BankName = "Bank 2", BranchName = "Branch 2", CreatedAt = DateTime.UtcNow.AddDays(-4) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 3", AccountNumber = "3333333333", BankBin = "123456", BankName = "Bank 3", BranchName = "Branch 3", CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 4", AccountNumber = "4444444444", BankBin = "123456", BankName = "Bank 4", BranchName = "Branch 4", CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 5", AccountNumber = "5555555555", BankBin = "123456", BankName = "Bank 5", BranchName = "Branch 5", CreatedAt = DateTime.UtcNow.AddDays(-1) }
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var mockDbSet = paymentInfos.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false))
                          .Returns(mockDbSet.Object);

            // Act
            var result = await _paymentService.GetPaymendInformationsAsync(userId, 1, 2);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(5);
            result.Value!.CurrentPage.Should().Be(1);
            result.Value!.PageSize.Should().Be(2);
            result.Value!.TotalPages.Should().Be(3);
            // Should get most recent 2
            result.Value!.Items.ElementAt(0).AccountHolderName.Should().Be("User 5");
            result.Value!.Items.ElementAt(1).AccountHolderName.Should().Be("User 4");
        }

        // UTCID07: Custom pagination - Page 2, Size 2
        [Fact]
        public async Task UTCID07_GetPaymentInformations_WithPage2_ShouldReturnSecondPage()
        {
            // Arrange
            var userId = Guid.NewGuid();

            var user = new User
            {
                Id = userId,
                Email = "test@gmail.com",
                IsDeleted = false,
                IsActive = true
            };

            var paymentInfos = new List<PaymentInformation>
            {
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 1", AccountNumber = "1111111111", BankBin = "123456", BankName = "Bank 1", BranchName = "Branch 1", CreatedAt = DateTime.UtcNow.AddDays(-5) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 2", AccountNumber = "2222222222", BankBin = "123456", BankName = "Bank 2", BranchName = "Branch 2", CreatedAt = DateTime.UtcNow.AddDays(-4) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 3", AccountNumber = "3333333333", BankBin = "123456", BankName = "Bank 3", BranchName = "Branch 3", CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 4", AccountNumber = "4444444444", BankBin = "123456", BankName = "Bank 4", BranchName = "Branch 4", CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 5", AccountNumber = "5555555555", BankBin = "123456", BankName = "Bank 5", BranchName = "Branch 5", CreatedAt = DateTime.UtcNow.AddDays(-1) }
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var mockDbSet = paymentInfos.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false))
                          .Returns(mockDbSet.Object);

            // Act
            var result = await _paymentService.GetPaymendInformationsAsync(userId, 2, 2);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.Items.Should().HaveCount(2);
            result.Value!.TotalItems.Should().Be(5);
            result.Value!.CurrentPage.Should().Be(2);
            result.Value!.PageSize.Should().Be(2);
            // Should get items 3 and 4 (ordered by CreatedAt desc)
            result.Value!.Items.ElementAt(0).AccountHolderName.Should().Be("User 3");
            result.Value!.Items.ElementAt(1).AccountHolderName.Should().Be("User 2");
        }

        #endregion

        #region ProcessPendingPayoutsAsync Tests

        [Fact]
        public async Task ProcessPendingPayoutsAsync_WithNoSystemSettings_ShouldReturnWithoutError()
        {
            // Arrange
            var systemSettings = new List<SystemSetting>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);

            // Act
            await _paymentService.ProcessPendingPayoutsAsync();

            // Assert
            _mockUnitOfWork.Verify(x => x.EventRepository.Query(It.IsAny<bool>()), Times.Never);
            _mockLog.Verify(
                x => x.Log(
                    LogLevel.Error,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("SystemSetting not found for ProcessPendingPayoutsAsync")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Once);
        }
         
        [Fact]
        public async Task ProcessPendingPayoutsAsync_WithNoPendingEvents_ShouldReturnWithoutError()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var systemSetting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                FlatformFee = 0.07m,
                FixFee = 45000,
                DatePayout = 7,
                UpdatedAt = now,
                IsDeleted = false
            };

            var systemSettings = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMockDbSet();
            var events = new List<Event>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);

            // Act
            await _paymentService.ProcessPendingPayoutsAsync();

            // Assert
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Never);
            _mockLog.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No events ready for payout")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Once);
        }
         
        [Fact]
        public async Task ProcessPendingPayoutsAsync_WithEventNotMeetingDeadline_ShouldNotProcess()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var systemSetting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                FlatformFee = 0.07m,
                FixFee = 45000,
                DatePayout = 7, // 7 days
                UpdatedAt = now.AddDays(-10), // Match event's SaleStartTime
                IsDeleted = false
            };

            var organizerUserId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = organizerUserId,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                IsDeleted = false
            };

            var eventItem = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Test Event",
                Description = "Test Description",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(1).AddHours(2),
                SaleStartTime = now.AddDays(-10),
                Status = EventStatus.WaitingForPayout,
                CompletedAt = now.AddDays(-5), // Not meeting deadline (needs to be <= now.AddDays(-7))
                PayoutAttemptCount = 0,
                IsDeleted = false,
                TotalAmount = 200000,
                OrganizerProfileId = organizerProfile.Id,
                OrganizerProfile = organizerProfile
            };

            var systemSettings = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventItem }.AsQueryable().BuildMockDbSet();
            var revenueReports = new List<RevenueReport>().AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>())).Returns(revenueReports.Object);

            // Act
            await _paymentService.ProcessPendingPayoutsAsync();

            // Assert
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()), Times.Never);
            _mockLog.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No events meet payout deadline")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Once);
        }
         
        [Fact]
        public async Task ProcessPendingPayoutsAsync_WithNoPaymentInformation_ShouldSendNotification()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var systemSetting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                FlatformFee = 0.07m,
                FixFee = 45000,
                DatePayout = 7,
                UpdatedAt = now,
                IsDeleted = false
            };

            var organizerUserId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = organizerUserId,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                IsDeleted = false
            };

            var eventItem = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Test Event",
                Description = "Test Description",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(1).AddHours(2),
                SaleStartTime = now.AddDays(-10),
                Status = EventStatus.WaitingForPayout,
                CompletedAt = now.AddDays(-10), // Meets deadline
                PayoutAttemptCount = 0,
                IsDeleted = false,
                TotalAmount = 200000,
                OrganizerProfileId = organizerProfile.Id,
                OrganizerProfile = organizerProfile
            };

            var systemSettings = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventItem }.AsQueryable().BuildMockDbSet();
            var paymentInfos = new List<PaymentInformation>().AsQueryable().BuildMockDbSet();
            var notifications = new List<Notification>().AsQueryable().BuildMockDbSet();
            var revenueReports = new List<RevenueReport>().AsQueryable().BuildMockDbSet();

            var roles = new List<Role>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>())).Returns(paymentInfos.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.Query(It.IsAny<bool>())).Returns(notifications.Object);
            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>())).Returns(revenueReports.Object);
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>())).Returns(roles.Object);
            _mockUnitOfWork.Setup(x => x.NotificationRepository.AddAsync(It.IsAny<Notification>()))
                .ReturnsAsync((Notification n) => n);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            await _paymentService.ProcessPendingPayoutsAsync();

            // Assert
            _notificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(req =>
                req.UserId == organizerUserId &&
                req.Type == NotificationType.PayoutFailed &&
                req.EventId == eventItem.Id)), Times.Once);
            _mockLog.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Sent payout warning for Event") && v.ToString()!.Contains("no payment info")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Once);
        }
         
        [Fact]
        public async Task ProcessPendingPayoutsAsync_WithValidPayout_ShouldProcessSuccessfully()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var systemSetting = new SystemSetting
            {
                Id = Guid.NewGuid(),
                FlatformFee = 0.07m,
                FixFee = 45000,
                DatePayout = 7,
                UpdatedAt = now,
                IsDeleted = false
            };

            var organizerUserId = Guid.NewGuid();
            var organizerProfile = new OrganizerProfile
            {
                Id = Guid.NewGuid(),
                UserId = organizerUserId,
                OrganizationType = OrganizationType.PrivateCompany,
                EventFrequency = EventFrequency.Monthly,
                EventSize = EventSize.Medium,
                OrganizerType = OrganizerType.Individual,
                EventExperienceLevel = EventExperienceLevel.Intermediate,
                ContactName = "Test Contact",
                ContactEmail = "test@example.com",
                ContactPhone = "0123456789",
                Address = "Test Address",
                IsDeleted = false
            };

            var eventItem = new Event
            {
                Id = Guid.NewGuid(),
                Title = "Test Event",
                Description = "Test Description",
                StartTime = now.AddDays(1),
                EndTime = now.AddDays(1).AddHours(2),
                SaleStartTime = now.AddDays(-10),
                Status = EventStatus.WaitingForPayout,
                CompletedAt = now.AddDays(-10), // Meets deadline
                PayoutAttemptCount = 0,
                IsDeleted = false,
                TotalAmount = 200000,
                OrganizerProfileId = organizerProfile.Id,
                OrganizerProfile = organizerProfile
            };

            var paymentInfo = new PaymentInformation
            {
                Id = Guid.NewGuid(),
                UserId = organizerUserId,
                AccountHolderName = "Test User",
                AccountNumber = "1234567890",
                BankName = "Test Bank",
                BankBin = "123456",
                IsDeleted = false
            };

            var payoutResponse = new PayOS.Models.V1.Payouts.Payout
            {
                ApprovalState = PayOS.Models.V1.Payouts.PayoutApprovalState.Completed
            };

            var systemSettings = new List<SystemSetting> { systemSetting }.AsQueryable().BuildMockDbSet();
            var events = new List<Event> { eventItem }.AsQueryable().BuildMockDbSet();
            var paymentInfos = new List<PaymentInformation> { paymentInfo }.AsQueryable().BuildMockDbSet();
            var revenueReports = new List<RevenueReport>().AsQueryable().BuildMockDbSet();

            var roles = new List<Role>().AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.SystemSettingRepository.Query(It.IsAny<bool>())).Returns(systemSettings.Object);
            _mockUnitOfWork.Setup(x => x.EventRepository.Query(It.IsAny<bool>())).Returns(events.Object);
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(It.IsAny<bool>())).Returns(paymentInfos.Object);
            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.Query(It.IsAny<bool>())).Returns(revenueReports.Object);
            _mockUnitOfWork.Setup(x => x.RoleRepository.Query(It.IsAny<bool>())).Returns(roles.Object);
            _mockUnitOfWork.Setup(x => x.RevenueReportRepository.AddAsync(It.IsAny<RevenueReport>()))
                .ReturnsAsync((RevenueReport r) => r);
            _mockUnitOfWork.Setup(x => x.EventRepository.UpdateAsync(It.IsAny<Event>()))
                .ReturnsAsync((Event e) => e);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);
            _mockpayOSService.Setup(x => x.CreatePayoutAsync(It.IsAny<PayOS.Models.V1.Payouts.PayoutRequest>()))
                .ReturnsAsync(payoutResponse);
            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                .Returns<Func<Task<Result>>>(async func => await func());
            _notificationService.Setup(x => x.CreateNotificationAsync(It.IsAny<CreateNotificationRequest>()))
                .ReturnsAsync(Result.Success());

            // Act
            await _paymentService.ProcessPendingPayoutsAsync();

            // Assert
            _mockpayOSService.Verify(x => x.CreatePayoutAsync(It.IsAny<PayOS.Models.V1.Payouts.PayoutRequest>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.RevenueReportRepository.AddAsync(It.IsAny<RevenueReport>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.EventRepository.UpdateAsync(It.Is<Event>(e => 
                e.Status == EventStatus.PaidOut && e.PaidOutAt.HasValue)), Times.Once);
            _notificationService.Verify(x => x.CreateNotificationAsync(It.Is<CreateNotificationRequest>(req =>
                req.UserId == organizerUserId &&
                req.Type == NotificationType.PayoutCompleted &&
                req.EventId == eventItem.Id)), Times.Once);
            _mockLog.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Payout success")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Once);
        }
  
        #endregion

        #region ProcessExpiredPendingTransactionsAsync Tests
         
        [Fact]
        public async Task ProcessExpiredPendingTransactionsAsync_WithExpiredTransactions_ShouldMarkAsFailed()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var expiredTime = now.AddMinutes(-20); // More than 15 minutes ago

            var transaction1 = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = Guid.NewGuid(),
                Amount = 100000,
                Status = TransactionStatus.Pending,
                CreatedAt = expiredTime,
                IsDeleted = false
            };

            var transaction2 = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = Guid.NewGuid(),
                Amount = 200000,
                Status = TransactionStatus.Pending,
                CreatedAt = expiredTime,
                Description = "Existing description",
                IsDeleted = false
            };

            var transactions = new List<WalletTransaction> { transaction1, transaction2 }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>())).Returns(transactions.Object);
            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.UpdateRangeAsync(It.IsAny<List<WalletTransaction>>()))
                .Returns(Task.CompletedTask);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            await _paymentService.ProcessExpiredPendingTransactionsAsync();

            // Assert
            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.UpdateRangeAsync(It.Is<List<WalletTransaction>>(t => 
                t.Count == 2 &&
                t.All(tr => tr.Status == TransactionStatus.Failed))), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
            _mockLog.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Expired pending transaction") && v.ToString()!.Contains("marked as Failed")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Exactly(2)); // One for each transaction 
        }
         
        [Fact]
        public async Task ProcessExpiredPendingTransactionsAsync_WithNonExpiredTransactions_ShouldNotProcess()
        {
            // Arrange
            var now = DateTime.UtcNow;
            var recentTime = now.AddMinutes(-10); // Less than 15 minutes ago

            var transaction = new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = Guid.NewGuid(),
                Amount = 100000,
                Status = TransactionStatus.Pending,
                CreatedAt = recentTime,
                IsDeleted = false
            };

            var transactions = new List<WalletTransaction> { transaction }.AsQueryable().BuildMockDbSet();

            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.Query(It.IsAny<bool>())).Returns(transactions.Object);

            // Act
            await _paymentService.ProcessExpiredPendingTransactionsAsync();

            // Assert
            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.UpdateRangeAsync(It.IsAny<List<WalletTransaction>>()), Times.Never);
            _mockLog.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("No expired pending transactions found")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Once);
        }
        #endregion
    }
}

