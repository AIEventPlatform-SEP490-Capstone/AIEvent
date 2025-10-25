using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Net.payOS.Types;

namespace AIEvent.Application.Services.Implements
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPayOSService _payOSService;
        private readonly IConfiguration _configuration;
        private readonly ITransactionHelper _transactionHelper;
        public PaymentService(IUnitOfWork unitOfWork, IConfiguration configuration, ITransactionHelper transactionHelper, IPayOSService payOSService)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _transactionHelper = transactionHelper;
            _payOSService = payOSService;
        }

        public async Task<Result<CreatePaymentResult>> CreatePaymentTopUpAsync(Guid userId, long amount)
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

            var result = await CreatePaymentAsync("Nạp tiền vào ví", amount, wallet, userId, TransactionType.Topup, TransactionDirection.In, ReferenceType.TopUpRequest);

            if(!result.IsSuccess)
                return ErrorResponse.FailureResult(result.Error!.Message, result.Error!.StatusCode);

            return Result<CreatePaymentResult>.Success(result.Value!);
        }

        private async Task<Result<CreatePaymentResult>> CreatePaymentAsync(string description, 
                                                                    long amount,
                                                                    Wallet wallet, 
                                                                    Guid userId, 
                                                                    TransactionType type,
                                                                    TransactionDirection direction,
                                                                    ReferenceType referenceType)
        {

            try
            {
                var expiredAt = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();

                var items = new List<ItemData>
                {
                    new ItemData(description, 1,(int) amount)
                };
                var paymentData = new PaymentData(
                    orderCode: GenerateOrderCode(),
                    amount: (int)amount,
                    description: description,
                    items: items,
                    cancelUrl: _configuration["PayOS:CancelUrl"] ?? "http://localhost:5173/wallet",
                    returnUrl: _configuration["PayOS:ReturnUrl"] ?? "http://localhost:5173/wallet",
                    expiredAt: expiredAt
                );
                var result = await _payOSService.CreatePaymentLinkAsync(paymentData);
                await _unitOfWork.WalletTransactionRepository.AddAsync(new WalletTransaction
                {
                    OrderCode = paymentData.orderCode.ToString(),
                    WalletId = wallet.Id,
                    CreatedBy = userId.ToString(),
                    Amount = amount,
                    BalanceBefore = wallet.Balance,
                    BalanceAfter = wallet.Balance,
                    Type = type,
                    Direction = direction,
                    Status = TransactionStatus.Pending,
                    Description = description,
                    ReferenceId = userId,
                    ReferenceType = referenceType
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

        private static long GenerateOrderCode()
        {
            var random = new Random();
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var randomPart = random.Next(1000, 9999);
            return long.Parse($"{timestamp}{randomPart}");
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
                    WebhookData data = _payOSService.VerifyPaymentWebhookData(webhookBody);
                    if (data == null)
                        return ErrorResponse.FailureResult("Invalid webhook data.", ErrorCodes.InvalidInput);

                    if (webhookBody.code != "00" || !webhookBody.success)
                        return ErrorResponse.FailureResult($"Payment failed: {webhookBody.desc}", ErrorCodes.InvalidInput);

                    var transaction = await _unitOfWork.WalletTransactionRepository
                                                            .Query()
                                                            .FirstOrDefaultAsync(t => t.OrderCode == data.orderCode.ToString());
                    if (transaction == null)
                        return ErrorResponse.FailureResult("WalletTransaction not found or deleted", ErrorCodes.NotFound);

                    if (transaction.Status == TransactionStatus.Success)
                        return Result.Success();

                    if (transaction.Status == TransactionStatus.Failed)
                        return ErrorResponse.FailureResult("Transaction fail", ErrorCodes.InternalServerError);

                    if (transaction.Amount != data.amount)
                        return ErrorResponse.FailureResult("Amount mismatch", ErrorCodes.InvalidInput);

                    var wallet = await _unitOfWork.WalletRepository
                       .Query()
                       .FirstOrDefaultAsync(w => w.Id == transaction.WalletId);
                    if (wallet == null || wallet.IsDeleted == true)
                        return ErrorResponse.FailureResult("Wallet not found or deleted", ErrorCodes.NotFound);

                    return await _transactionHelper.ExecuteInTransactionAsync(async () =>
                    {
                        transaction.Status = TransactionStatus.Success;
                        wallet.Balance += transaction.Amount;
                        transaction.BalanceAfter = wallet.Balance;
                        transaction.Status = TransactionStatus.Success;
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
