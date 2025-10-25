using AIEvent.Application.Constants;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using MockQueryable.Moq;
using Moq; 
using Net.payOS.Types;

namespace AIEvent.Application.Test.Services
{
    public class PaymentServiceTests
    {
        private readonly Mock<IPayOSService> _mockpayOSService;
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<ITransactionHelper> _mockTransactionHelper;
        private readonly IPaymentService _paymentService;

        public PaymentServiceTests()
        {
            _mockpayOSService = new Mock<IPayOSService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();

            // Setup configuration default values
            _mockConfiguration.Setup(c => c["PayOS:CancelUrl"]).Returns("http://localhost:5173/wallet");
            _mockConfiguration.Setup(c => c["PayOS:ReturnUrl"]).Returns("http://localhost:5173/wallet");

            _paymentService = new PaymentService(
                _mockUnitOfWork.Object,
                _mockConfiguration.Object,
                _mockTransactionHelper.Object,
                _mockpayOSService.Object
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
            long amount = 10000; 
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
            result.Error!.Message.Should().Contain("Failed to create payment link");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
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
            result.Error!.Message.Should().Contain("Failed to create payment link");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
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
        public async Task UTCID11_CreatePaymentTopUpAsync_WithZeroWalletBalance_ShouldReturnFailure()
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
            result.Error!.Message.Should().Contain("Failed to create payment link");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockUnitOfWork.Verify(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()), Times.Never());
        }

        [Fact]
        public async Task UTCID12_CreatePaymentTopUpAsync_WithVeryLargeWalletBalance_ShouldReturnFailure()
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
                Balance = 999999999999, 
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
        }

        [Fact]
        public async Task UTCID13_CreatePaymentTopUpAsync_WithValidData_PayOSSuccess_ShouldReturnPaymentUrl()
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
            _mockUnitOfWork.Setup(x => x.WalletRepository.Query(It.IsAny<bool>()))
                           .Returns(walletDbSet.Object);

            _mockConfiguration.Setup(c => c["PayOS:CancelUrl"]).Returns("https://example.com/cancel");
            _mockConfiguration.Setup(c => c["PayOS:ReturnUrl"]).Returns("https://example.com/return");

            var payOsResult = new CreatePaymentResult(
                bin: "970415",                          
                accountNumber: "1234567890",            
                amount: (int)amount,                    
                description: "Nạp tiền vào ví",         
                orderCode: 202504051234567,             
                currency: "VND",                        
                paymentLinkId: "plink_abc123",          
                status: "PENDING",                      
                expiredAt: DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds(), 
                checkoutUrl: "https://pay.payos.vn/checkout/abc123", 
                qrCode: "https://pay.payos.vn/qr/abc123"  
            );

            _mockpayOSService.Setup(x => x.CreatePaymentLinkAsync(It.IsAny<PaymentData>()))
                      .ReturnsAsync(payOsResult);

            _mockUnitOfWork.Setup(x => x.WalletTransactionRepository.AddAsync(It.IsAny<WalletTransaction>()))
                           .ReturnsAsync((WalletTransaction wt) => wt);

            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.checkoutUrl.Should().Be("https://pay.payos.vn/checkout/abc123");
            result.Value!.orderCode.Should().Be(202504051234567);
            result.Value!.status.Should().Be("PENDING");

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
        #endregion
    }
}

