using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.PaymentInformation;
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
        private readonly Mock<IMapper> _mockMapper;
        public PaymentServiceTests()
        {
            _mockpayOSService = new Mock<IPayOSService>();
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockTransactionHelper = new Mock<ITransactionHelper>();
            _mockMapper = new Mock<IMapper>();
            // Setup configuration default values
            _mockConfiguration.Setup(c => c["PayOS:CancelUrl"]).Returns("http://localhost:5173/wallet");
            _mockConfiguration.Setup(c => c["PayOS:ReturnUrl"]).Returns("http://localhost:5173/wallet");

            _paymentService = new PaymentService(
                _mockUnitOfWork.Object,
                _mockConfiguration.Object,
                _mockTransactionHelper.Object,
                _mockpayOSService.Object,
                _mockMapper.Object
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

        #region PaymentWebhookAsync

        // UTCID01: Null webhook body - Should throw ArgumentNullException
        [Fact]
        public async Task UTCID01_PaymentWebhookAsync_WithNullWebhookBody_ShouldThrowArgumentNullException()
        {
            // Arrange
            WebhookType? webhookBody = null;

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentNullException>(
                async () => await _paymentService.PaymentWebhookAsync(webhookBody!)
            );

            exception.ParamName.Should().Be("webhookBody");
            exception.Message.Should().Contain("Webhook payload is null");
        }

        // UTCID02: Webhook success is false - Should return failure
        [Fact]
        public async Task UTCID02_PaymentWebhookAsync_WithSuccessFalse_ShouldReturnFailure()
        {
            // Arrange
            var webhookBody = new WebhookType(
                code: "01",
                desc: "Payment failed",
                success: false,
                data: new WebhookData(
                    orderCode: 123456789,
                    amount: 50000,
                    description: "Test payment",
                    accountNumber: "1234567890",
                    reference: "REF123",
                    transactionDateTime: "2024-01-01 10:00:00",
                    currency: "VND",
                    paymentLinkId: "plink_123",
                    code: "01",
                    desc: "Payment failed",
                    counterAccountBankId: null,
                    counterAccountBankName: null,
                    counterAccountName: null,
                    counterAccountNumber: null,
                    virtualAccountName: null,
                    virtualAccountNumber: null!
                ),
                signature: "signature123"
            );

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Transaction fail");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockpayOSService.Verify(x => x.VerifyPaymentWebhookData(It.IsAny<WebhookType>()), Times.Never());
        }

        // UTCID03: Webhook verification returns null - Should return failure
        [Fact]
        public async Task UTCID03_PaymentWebhookAsync_WithNullVerificationData_ShouldReturnFailure()
        {
            // Arrange
            var webhookBody = new WebhookType(
                code: "00",
                desc: "Success",
                success: true,
                data: new WebhookData(
                    orderCode: 123456789,
                    amount: 50000,
                    description: "Test payment",
                    accountNumber: "1234567890",
                    reference: "REF123",
                    transactionDateTime: "2024-01-01 10:00:00",
                    currency: "VND",
                    paymentLinkId: "plink_123",
                    code: "00",
                    desc: "Success",
                    counterAccountBankId: null,
                    counterAccountBankName: null,
                    counterAccountName: null,
                    counterAccountNumber: null,
                    virtualAccountName: null,
                    virtualAccountNumber: null!
                ),
                signature: "invalid_signature"
            );

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .Returns((WebhookData?)null!);

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
            var webhookData = new WebhookData(
                orderCode: 123456789,
                amount: 50000,
                description: "Test payment",
                accountNumber: "1234567890",
                reference: "REF123",
                transactionDateTime: "2024-01-01 10:00:00",
                currency: "VND",
                paymentLinkId: "plink_123",
                code: "01",
                desc: "Payment failed",
                counterAccountBankId: null,
                counterAccountBankName: null,
                counterAccountName: null,
                counterAccountNumber: null,
                virtualAccountName: null,
                virtualAccountNumber: null!
            );

            var webhookBody = new WebhookType(
                code: "01",
                desc: "Payment failed",
                success: true,
                data: webhookData,
                signature: "signature123"
            );

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .Returns(webhookData);

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
            var webhookData = new WebhookData(
                orderCode: 123456789,
                amount: 50000,
                description: "Test payment",
                accountNumber: "1234567890",
                reference: "REF123",
                transactionDateTime: "2024-01-01 10:00:00",
                currency: "VND",
                paymentLinkId: "plink_123",
                code: "00",
                desc: "Success",
                counterAccountBankId: null,
                counterAccountBankName: null,
                counterAccountName: null,
                counterAccountNumber: null,
                virtualAccountName: null,
                virtualAccountNumber: null!
            );

            var webhookBody = new WebhookType(
                code: "00",
                desc: "Success",
                success: true,
                data: webhookData,
                signature: "signature123"
            );

            _mockpayOSService.Setup(x => x.VerifyPaymentWebhookData(webhookBody))
                            .Returns(webhookData);

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

            var webhookData = new WebhookData(
                orderCode: long.Parse(orderCode),
                amount: 50000,
                description: "Test payment",
                accountNumber: "1234567890",
                reference: "REF123",
                transactionDateTime: "2024-01-01 10:00:00",
                currency: "VND",
                paymentLinkId: "plink_123",
                code: "00",
                desc: "Success",
                counterAccountBankId: null,
                counterAccountBankName: null,
                counterAccountName: null,
                counterAccountNumber: null,
                virtualAccountName: null,
                virtualAccountNumber: null!
            );

            var webhookBody = new WebhookType(
                code: "00",
                desc: "Success",
                success: true,
                data: webhookData,
                signature: "signature123"
            );

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
                            .Returns(webhookData);

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

            var webhookData = new WebhookData(
                orderCode: long.Parse(orderCode),
                amount: 60000, // Different amount
                description: "Test payment",
                accountNumber: "1234567890",
                reference: "REF123",
                transactionDateTime: "2024-01-01 10:00:00",
                currency: "VND",
                paymentLinkId: "plink_123",
                code: "00",
                desc: "Success",
                counterAccountBankId: null,
                counterAccountBankName: null,
                counterAccountName: null,
                counterAccountNumber: null,
                virtualAccountName: null,
                virtualAccountNumber: null!
            );

            var webhookBody = new WebhookType(
                code: "00",
                desc: "Success",
                success: true,
                data: webhookData,
                signature: "signature123"
            );

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
                            .Returns(webhookData);

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

            var webhookData = new WebhookData(
                orderCode: long.Parse(orderCode),
                amount: 50000,
                description: "Test payment",
                accountNumber: "1234567890",
                reference: "REF123",
                transactionDateTime: "2024-01-01 10:00:00",
                currency: "VND",
                paymentLinkId: "plink_123",
                code: "00",
                desc: "Success",
                counterAccountBankId: null,
                counterAccountBankName: null,
                counterAccountName: null,
                counterAccountNumber: null,
                virtualAccountName: null,
                virtualAccountNumber: null!
            );

            var webhookBody = new WebhookType(
                code: "00",
                desc: "Success",
                success: true,
                data: webhookData,
                signature: "signature123"
            );

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
                            .Returns(webhookData);

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

            var webhookData = new WebhookData(
                orderCode: long.Parse(orderCode),
                amount: 50000,
                description: "Test payment",
                accountNumber: "1234567890",
                reference: "REF123",
                transactionDateTime: "2024-01-01 10:00:00",
                currency: "VND",
                paymentLinkId: "plink_123",
                code: "00",
                desc: "Success",
                counterAccountBankId: null,
                counterAccountBankName: null,
                counterAccountName: null,
                counterAccountNumber: null,
                virtualAccountName: null,
                virtualAccountNumber: null! 
            );

            var webhookBody = new WebhookType(
                code: "00",
                desc: "Success",
                success: true,
                data: webhookData,
                signature: "signature123"
            );

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
                            .Returns(webhookData);

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

        // UTCID10: Boundary - Code with different format (not "00" but success false already)
        [Fact]
        public async Task UTCID10_PaymentWebhookAsync_WithSuccessFalseAndNonZeroCode_ShouldReturnFailure()
        {
            // Arrange
            var webhookBody = new WebhookType(
                code: "99",
                desc: "Unknown error",
                success: false,
                data: new WebhookData(
                    orderCode: 123456789,
                    amount: 50000,
                    description: "Test payment",
                    accountNumber: "1234567890",
                    reference: "REF123",
                    transactionDateTime: "2024-01-01 10:00:00",
                    currency: "VND",
                    paymentLinkId: "plink_123",
                    code: "99",
                    desc: "Unknown error",
                    counterAccountBankId: null,
                    counterAccountBankName: null,
                    counterAccountName: null,
                    counterAccountNumber: null,
                    virtualAccountName: null,
                    virtualAccountNumber: null! 
                ),
                signature: "signature123"
            );

            // Act
            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Transaction fail");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockpayOSService.Verify(x => x.VerifyPaymentWebhookData(It.IsAny<WebhookType>()), Times.Never());
        }

        #endregion

        #region AddPaymentInformation

        // UTCID01: Valid request with all required fields, successful addition
        [Fact]
        public async Task UTCID01_AddPaymentInformation_WithValidRequest_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
                BranchName = request.BranchName
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
            CreatePaymentInformationRequest? request = null;

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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
            _mockMapper.Verify(x => x.Map<PaymentInformation>(It.IsAny<CreatePaymentInformationRequest>()), Times.Never());
        }

        // UTCID05: User is deleted - Should return failure
        [Fact]
        public async Task UTCID05_AddPaymentInformation_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
            _mockMapper.Verify(x => x.Map<PaymentInformation>(It.IsAny<CreatePaymentInformationRequest>()), Times.Never());
        }

        // UTCID06: Mapper returns null - Should return failure
        [Fact]
        public async Task UTCID06_AddPaymentInformation_WithMapperReturningNull_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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

            _mockMapper.Setup(x => x.Map<PaymentInformation>(request))
                      .Returns((PaymentInformation?)null!);

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Failed to map payment information");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InternalServerError);
            _mockTransactionHelper.Verify(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()), Times.Never());
        }

        // UTCID07: AccountHolderName is null - Should return validation failure
        [Fact]
        public async Task UTCID07_AddPaymentInformation_WithNullAccountHolderName_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = null!,
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = null!,
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "12345", // 5 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123456789012345678901", // 21 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must be between 6 and 20 digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID11: AccountNumber with non-digits (letters) - Should return validation failure
        [Fact]
        public async Task UTCID11_AddPaymentInformation_WithNonDigitAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "12345ABC67", // Contains letters
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must contain only digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID12: AccountNumber with special characters - Should return validation failure
        [Fact]
        public async Task UTCID12_AddPaymentInformation_WithSpecialCharactersInAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123-456-789", // Contains hyphens
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must contain only digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID13: AccountNumber minimum valid (6 digits) - Boundary test - Success
        [Fact]
        public async Task UTCID13_AddPaymentInformation_WithMinimumValidAccountNumber_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123456", // Exactly 6 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
                BranchName = request.BranchName
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "12345678901234567890", // Exactly 20 digits
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
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
                BranchName = request.BranchName
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = null!,
                BranchName = "Ho Chi Minh City Branch"
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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = null!
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
            var request = new CreatePaymentInformationRequest
            {
                AccountHolderName = "John Doe",
                AccountNumber = "123 456 789", // Contains spaces
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            // Act
            var result = await _paymentService.AddPaymendInformationAsync(userId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must contain only digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }
        #endregion

        #region UpdatePaymentInformation

        // UTCID01: Valid request with all fields, successful update
        [Fact]
        public async Task UTCID01_UpdatePaymentInformation_WithValidRequestAllFields_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe",
                AccountNumber = "9876543210",
                BankName = "ACB Bank",
                BranchName = "Hanoi Branch"
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
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync(existingPaymentInfo);

            _mockMapper.Setup(x => x.Map(request, existingPaymentInfo))
                      .Callback<UpdatePaymentInformationRequest, PaymentInformation>((src, dest) =>
                      {
                          dest.AccountHolderName = src.AccountHolderName ?? dest.AccountHolderName;
                          dest.AccountNumber = src.AccountNumber ?? dest.AccountNumber;
                          dest.BankName = src.BankName ?? dest.BankName;
                          dest.BranchName = src.BranchName ?? dest.BranchName;
                      });

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.UpdateAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(existingPaymentInfo);

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.UpdateAsync(existingPaymentInfo), Times.Once());
        }

        // UTCID02: Valid request with partial fields (only AccountHolderName)
        [Fact]
        public async Task UTCID02_UpdatePaymentInformation_WithPartialFields_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
                // Other fields are null
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
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync(existingPaymentInfo);

            _mockMapper.Setup(x => x.Map(request, existingPaymentInfo));

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.UpdateAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(existingPaymentInfo);

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID03: Empty Guid userId - Should return failure
        [Fact]
        public async Task UTCID03_UpdatePaymentInformation_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID04: Empty Guid paymentInformationId - Should return failure
        [Fact]
        public async Task UTCID04_UpdatePaymentInformation_WithEmptyPaymentInformationId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.Empty;
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID05: Both userId and paymentInformationId are empty - Should return failure
        [Fact]
        public async Task UTCID05_UpdatePaymentInformation_WithBothIdsEmpty_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var paymentInformationId = Guid.Empty;
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
        }

        // UTCID06: Null request - Should return validation failure
        [Fact]
        public async Task UTCID06_UpdatePaymentInformation_WithNullRequest_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            UpdatePaymentInformationRequest? request = null;

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request!);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID07: User not found - Should return failure
        [Fact]
        public async Task UTCID07_UpdatePaymentInformation_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync((User?)null);

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID08: User is deleted - Should return failure
        [Fact]
        public async Task UTCID08_UpdatePaymentInformation_WithDeletedUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
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
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID09: PaymentInformation not found - Should return failure
        [Fact]
        public async Task UTCID09_UpdatePaymentInformation_WithNonExistentPaymentInfo_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
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

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync((PaymentInformation?)null);

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment Infor not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockMapper.Verify(x => x.Map(It.IsAny<UpdatePaymentInformationRequest>(), It.IsAny<PaymentInformation>()), Times.Never());
        }

        // UTCID10: PaymentInformation is deleted - Should return failure
        [Fact]
        public async Task UTCID10_UpdatePaymentInformation_WithDeletedPaymentInfo_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountHolderName = "Jane Doe"
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
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
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
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment Infor not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
            _mockMapper.Verify(x => x.Map(It.IsAny<UpdatePaymentInformationRequest>(), It.IsAny<PaymentInformation>()), Times.Never());
        }

        // UTCID11: AccountNumber too short (5 digits) - Boundary test
        [Fact]
        public async Task UTCID11_UpdatePaymentInformation_WithTooShortAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountNumber = "12345" // 5 digits
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must be between 6 and 20 digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID12: AccountNumber too long (21 digits) - Boundary test
        [Fact]
        public async Task UTCID12_UpdatePaymentInformation_WithTooLongAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountNumber = "123456789012345678901" // 21 digits
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must be between 6 and 20 digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID13: AccountNumber minimum valid (6 digits) - Boundary test - Success
        [Fact]
        public async Task UTCID13_UpdatePaymentInformation_WithMinimumValidAccountNumber_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountNumber = "123456" // Exactly 6 digits
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
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync(existingPaymentInfo);

            _mockMapper.Setup(x => x.Map(request, existingPaymentInfo));

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.UpdateAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(existingPaymentInfo);

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID14: AccountNumber maximum valid (20 digits) - Boundary test - Success
        [Fact]
        public async Task UTCID14_UpdatePaymentInformation_WithMaximumValidAccountNumber_ShouldReturnSuccess()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountNumber = "12345678901234567890" // Exactly 20 digits
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
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true))
                          .ReturnsAsync(existingPaymentInfo);

            _mockMapper.Setup(x => x.Map(request, existingPaymentInfo));

            _mockTransactionHelper.Setup(x => x.ExecuteInTransactionAsync(It.IsAny<Func<Task<Result>>>()))
                                 .Returns<Func<Task<Result>>>(func => func());

            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.UpdateAsync(It.IsAny<PaymentInformation>()))
                          .ReturnsAsync(existingPaymentInfo);

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeTrue();
        }

        // UTCID15: AccountNumber with non-digits (letters) - Should return validation failure
        [Fact]
        public async Task UTCID15_UpdatePaymentInformation_WithNonDigitAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountNumber = "12345ABC67" // Contains letters
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must contain only digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID16: AccountNumber with special characters - Should return validation failure
        [Fact]
        public async Task UTCID16_UpdatePaymentInformation_WithSpecialCharactersInAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountNumber = "123-456-789" // Contains hyphens
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must contain only digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID17: AccountNumber with spaces - Should return validation failure
        [Fact]
        public async Task UTCID17_UpdatePaymentInformation_WithSpacesInAccountNumber_ShouldReturnValidationFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();
            var request = new UpdatePaymentInformationRequest
            {
                AccountNumber = "123 456 789" // Contains spaces
            };

            // Act
            var result = await _paymentService.UpdatePaymendInformationAsync(userId, paymentInformationId, request);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Contain("Account number must contain only digits");
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
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
                IsDeleted = false
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
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new PaymentInformation
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
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
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 1", AccountNumber = "1111111111", BankName = "Bank 1", BranchName = "Branch 1", CreatedAt = DateTime.UtcNow.AddDays(-5) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 2", AccountNumber = "2222222222", BankName = "Bank 2", BranchName = "Branch 2", CreatedAt = DateTime.UtcNow.AddDays(-4) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 3", AccountNumber = "3333333333", BankName = "Bank 3", BranchName = "Branch 3", CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 4", AccountNumber = "4444444444", BankName = "Bank 4", BranchName = "Branch 4", CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 5", AccountNumber = "5555555555", BankName = "Bank 5", BranchName = "Branch 5", CreatedAt = DateTime.UtcNow.AddDays(-1) }
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
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 1", AccountNumber = "1111111111", BankName = "Bank 1", BranchName = "Branch 1", CreatedAt = DateTime.UtcNow.AddDays(-5) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 2", AccountNumber = "2222222222", BankName = "Bank 2", BranchName = "Branch 2", CreatedAt = DateTime.UtcNow.AddDays(-4) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 3", AccountNumber = "3333333333", BankName = "Bank 3", BranchName = "Branch 3", CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 4", AccountNumber = "4444444444", BankName = "Bank 4", BranchName = "Branch 4", CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new PaymentInformation { Id = Guid.NewGuid(), UserId = userId, AccountHolderName = "User 5", AccountNumber = "5555555555", BankName = "Bank 5", BranchName = "Branch 5", CreatedAt = DateTime.UtcNow.AddDays(-1) }
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

        #region GetPaymentInformationById

        // UTCID01: Valid userId and paymentInformationId - Should return success
        [Fact]
        public async Task UTCID01_GetPaymentInformationById_WithValidIds_ShouldReturnSuccess()
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

            var paymentInfo = new PaymentInformation
            {
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                IsDeleted = false
            };

            var paymentInfoResponse = new PaymentInformationResponse
            {
                PaymentInformationId = paymentInformationId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch"
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var paymentInfoList = new List<PaymentInformation> { paymentInfo };
            var mockDbSet = paymentInfoList.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false))
                          .Returns(mockDbSet.Object);

            _mockMapper.Setup(x => x.ConfigurationProvider)
                      .Returns(new MapperConfiguration(cfg => {
                          cfg.CreateMap<PaymentInformation, PaymentInformationResponse>()
                             .ForMember(dest => dest.PaymentInformationId, opt => opt.MapFrom(src => src.Id));
                      }));

            // Act
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeTrue();
            result.Value.Should().NotBeNull();
            result.Value!.PaymentInformationId.Should().Be(paymentInformationId);
            result.Value!.AccountHolderName.Should().Be("John Doe");
            result.Value!.AccountNumber.Should().Be("1234567890");
            result.Value!.BankName.Should().Be("Vietcombank");
            result.Value!.BranchName.Should().Be("Ho Chi Minh City Branch");
        }

        // UTCID02: Empty userId - Should return failure
        [Fact]
        public async Task UTCID02_GetPaymentInformationById_WithEmptyUserId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var paymentInformationId = Guid.NewGuid();

            // Act
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID03: Empty paymentInformationId - Should return failure
        [Fact]
        public async Task UTCID03_GetPaymentInformationById_WithEmptyPaymentInformationId_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.Empty;

            // Act
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID04: Both userId and paymentInformationId empty - Should return failure
        [Fact]
        public async Task UTCID04_GetPaymentInformationById_WithBothIdsEmpty_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.Empty;
            var paymentInformationId = Guid.Empty;

            // Act
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Invalid input");
            result.Error!.StatusCode.Should().Be(ErrorCodes.InvalidInput);
            _mockUnitOfWork.Verify(x => x.UserRepository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<bool>()), Times.Never());
        }

        // UTCID05: User not found - Should return failure
        [Fact]
        public async Task UTCID05_GetPaymentInformationById_WithNonExistentUser_ShouldReturnFailure()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var paymentInformationId = Guid.NewGuid();

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync((User?)null);

            // Act
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.Query(false), Times.Never());
        }

        // UTCID06: User is deleted - Should return failure
        [Fact]
        public async Task UTCID06_GetPaymentInformationById_WithDeletedUser_ShouldReturnFailure()
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
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("User not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.Unauthorized);
            _mockUnitOfWork.Verify(x => x.PaymentInformationRepository.Query(false), Times.Never());
        }

        // UTCID07: Payment information not found - Should return failure
        [Fact]
        public async Task UTCID07_GetPaymentInformationById_WithNonExistentPaymentInfo_ShouldReturnFailure()
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

            var emptyPaymentInfoList = new List<PaymentInformation>();
            var mockDbSet = emptyPaymentInfoList.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false))
                          .Returns(mockDbSet.Object);

            _mockMapper.Setup(x => x.ConfigurationProvider)
                      .Returns(new MapperConfiguration(cfg => {
                          cfg.CreateMap<PaymentInformation, PaymentInformationResponse>()
                             .ForMember(dest => dest.PaymentInformationId, opt => opt.MapFrom(src => src.Id));
                      }));

            // Act
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment Infor not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

        // UTCID08: Payment information is deleted - Should return failure
        [Fact]
        public async Task UTCID08_GetPaymentInformationById_WithDeletedPaymentInfo_ShouldReturnFailure()
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

            var paymentInfo = new PaymentInformation
            {
                Id = paymentInformationId,
                UserId = userId,
                AccountHolderName = "John Doe",
                AccountNumber = "1234567890",
                BankName = "Vietcombank",
                BranchName = "Ho Chi Minh City Branch",
                IsDeleted = true // Deleted
            };

            _mockUnitOfWork.Setup(x => x.UserRepository.GetByIdAsync(userId, true))
                          .ReturnsAsync(user);

            var paymentInfoList = new List<PaymentInformation> { paymentInfo };
            var mockDbSet = paymentInfoList.AsQueryable().BuildMockDbSet();
            _mockUnitOfWork.Setup(x => x.PaymentInformationRepository.Query(false))
                          .Returns(mockDbSet.Object);

            _mockMapper.Setup(x => x.ConfigurationProvider)
                      .Returns(new MapperConfiguration(cfg => {
                          cfg.CreateMap<PaymentInformation, PaymentInformationResponse>()
                             .ForMember(dest => dest.PaymentInformationId, opt => opt.MapFrom(src => src.Id));
                      }));

            // Act
            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, paymentInformationId);

            // Assert
            result.IsSuccess.Should().BeFalse();
            result.Error.Should().NotBeNull();
            result.Error!.Message.Should().Be("Payment Infor not found or inactive");
            result.Error!.StatusCode.Should().Be(ErrorCodes.NotFound);
        }

  
        #endregion
    }
}

