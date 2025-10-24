using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Net.payOS;
using Net.payOS.Types;

namespace AIEvent.Application.Services.Implements
{
    public class PaymentService : IPaymentService
    {
        private readonly PayOS _payOS;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _configuration;
        private readonly ITransactionHelper _transactionHelper;
        public PaymentService(PayOS payOS, IUnitOfWork unitOfWork, IConfiguration configuration, ITransactionHelper transactionHelper)
        {
            _payOS = payOS;
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _transactionHelper = transactionHelper;
        }

        public async Task<Result<CreatePaymentResult>> CreatePaymentAsync(Guid userId, long amount)
        {
            if (userId == Guid.Empty || amount < 10000)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted == true)
                return ErrorResponse.FailureResult("User not found or deleted", ErrorCodes.NotFound);

            var wallet = await _unitOfWork.WalletRepository
                                            .Query()
                                            .AsNoTracking()
                                            .FirstOrDefaultAsync(w => w.UserId == userId);
            if (wallet == null || wallet.IsDeleted == true)
                return ErrorResponse.FailureResult("Wallet not found or deleted", ErrorCodes.NotFound);

            long orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var expiredAt = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();

            var items = new List<ItemData>
            {
                new ItemData("Nạp tiền vào ví", 1,(int) amount)
            };

            var paymentData = new PaymentData(
                orderCode: orderCode,
                amount: (int)amount,
                description: $"Nạp tiền vào ví",
                items: items,
                cancelUrl: _configuration["PayOS:CancelUrl"] ?? "https://yourdomain.com/payment/cancel",
                returnUrl: _configuration["PayOS:ReturnUrl"] ?? "https://yourdomain.com/payment/success",
                expiredAt: expiredAt
            );

            try
            {
                var result = await _payOS.createPaymentLink(paymentData);
                await _unitOfWork.WalletTransactionRepository.AddAsync(new WalletTransaction
                {
                    OrderCode = orderCode.ToString(),
                    WalletId = wallet.Id,
                    CreatedBy = userId.ToString(),
                    Amount = amount,
                    BalanceBefore = wallet.Balance,
                    BalanceAfter = wallet.Balance,
                    Type = TransactionType.Topup,
                    Direction = TransactionDirection.In,
                    Status = TransactionStatus.Pending,
                    Description = "Nạp tiền vào ví",
                    ReferenceId = userId,
                    ReferenceType = ReferenceType.TopUpRequest
                });
                await _unitOfWork.SaveChangesAsync();
                return Result<CreatePaymentResult>.Success(result);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult(
                    $"Failed to create payment link: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result> PaymentWebhookAsync(WebhookType webhookBody)
        {
            if (webhookBody == null)
            {
                throw new ArgumentNullException(nameof(webhookBody), "Webhook payload is null.");
            }
            try
            {
                if (webhookBody.success)
                {
                    WebhookData data = _payOS.verifyPaymentWebhookData(webhookBody);
                    if (data == null)
                        return ErrorResponse.FailureResult("Invalid webhook data.", ErrorCodes.InvalidInput);

                    var transaction = await _unitOfWork.WalletTransactionRepository
                                                            .Query()
                                                            .AsNoTracking()
                                                            .FirstOrDefaultAsync(t => t.OrderCode == data.orderCode.ToString());
                    if (transaction == null)
                        return ErrorResponse.FailureResult("WalletTransaction not found or deleted", ErrorCodes.NotFound);
                    var wallet = await _unitOfWork.WalletRepository
                                           .Query()
                                           .AsNoTracking()
                                           .FirstOrDefaultAsync(w => w.Id == transaction.WalletId);
                    if (wallet == null || wallet.IsDeleted == true)
                        return ErrorResponse.FailureResult("Wallet not found or deleted", ErrorCodes.NotFound);

                    if (transaction.Status != TransactionStatus.Pending)
                        return ErrorResponse.FailureResult("Transaction fail", ErrorCodes.InternalServerError);
                    return await _transactionHelper.ExecuteInTransactionAsync(async () =>
                    {
                        transaction.Status = TransactionStatus.Success;
                        wallet.Balance += transaction.Amount;
                        await _unitOfWork.WalletTransactionRepository.UpdateAsync(transaction);
                        await _unitOfWork.WalletRepository.UpdateAsync(wallet);
                        return Result.Success();        
                    });

                }
                return ErrorResponse.FailureResult("Transaction fail", ErrorCodes.InternalServerError);
            }
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error transaction: ${ex.Message}", ErrorCodes.InternalServerError);
            }
        }

    }
}
