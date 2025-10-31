using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Payment;
using AIEvent.Application.DTOs.PaymentInformation;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PayOS.Models.V1.Payouts;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
namespace AIEvent.Application.Services.Implements
{
    public class PaymentService : IPaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPayOSService _payOSService;
        private readonly IConfiguration _configuration;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IMapper _mapper;
        public PaymentService(IUnitOfWork unitOfWork, IConfiguration configuration, ITransactionHelper transactionHelper, IPayOSService payOSService, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _transactionHelper = transactionHelper;
            _payOSService = payOSService;
            _mapper = mapper;
        }

        public async Task<Result<CreatePaymentLinkResponse>> CreatePaymentTopUpAsync(Guid userId, long amount)
        {
            if (userId == Guid.Empty || amount < 10000 || amount >= 1000000000)
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

            var result = await CreatePaymentAsync(
                description: "Nạp tiền vào ví",
                amount: amount,
                wallet: wallet,
                userId: userId,
                type: TransactionType.Topup,
                direction: TransactionDirection.In,
                referenceType: ReferenceType.TopUpRequest);

            if (!result.IsSuccess)
                return ErrorResponse.FailureResult(result.Error!.Message, result.Error!.StatusCode);

            return Result<CreatePaymentLinkResponse>.Success(result.Value!);
        }

        private async Task<Result<CreatePaymentLinkResponse>> CreatePaymentAsync(string description, 
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
                var orderCode = GenerateOrderCode();

                var items = new List<PaymentLinkItem>
                {
                    new() { Name = description, Quantity = 1, Price = (int)amount }
                };

                var paymentRequest = new CreatePaymentLinkRequest
                {
                    OrderCode = orderCode,
                    Amount = (int)amount,
                    Description = description,
                    Items = items,
                    ReturnUrl = _configuration["PayOS:ReturnUrl"] ?? "http://localhost:5173/wallet",
                    CancelUrl = _configuration["PayOS:CancelUrl"] ?? "http://localhost:5173/wallet",
                    ExpiredAt = expiredAt
                };

                var result = await _payOSService.CreatePaymentLinkAsync(paymentRequest);
                await _unitOfWork.WalletTransactionRepository.AddAsync(new WalletTransaction
                {
                    OrderCode = orderCode.ToString(),
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
                return Result<CreatePaymentLinkResponse>.Success(result);

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
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var randomPart = random.Next(100, 999);
            return long.Parse($"{timestamp}{randomPart}");
        }

        public async Task<Result> PaymentWebhookAsync(Webhook webhookBody)
        {
            if (webhookBody == null)
                return ErrorResponse.FailureResult("Webhook data is required", ErrorCodes.InvalidInput);

            try
            {

                if (webhookBody.Code != "00" || !webhookBody.Success)
                    return ErrorResponse.FailureResult($"Payment failed: {webhookBody.Description}", ErrorCodes.InvalidInput);

                WebhookData data = await _payOSService.VerifyPaymentWebhookData(webhookBody);
                if (data == null)
                    return ErrorResponse.FailureResult("Invalid webhook data.", ErrorCodes.InvalidInput);

                var transaction = await _unitOfWork.WalletTransactionRepository
                                                        .Query()
                                                        .FirstOrDefaultAsync(t => t.OrderCode == data.OrderCode.ToString());
                if (transaction == null)
                    return ErrorResponse.FailureResult("WalletTransaction not found or deleted", ErrorCodes.NotFound);

                if (transaction.Status == TransactionStatus.Success)
                    return Result.Success();

                if (transaction.Status == TransactionStatus.Failed)
                    return ErrorResponse.FailureResult("Transaction fail", ErrorCodes.InternalServerError);

                if (transaction.Amount != data.Amount)
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
            catch (Exception ex)
            {
                return ErrorResponse.FailureResult($"Error transaction: ${ex.Message}", ErrorCodes.InternalServerError);
            }
        }

        public async Task<Result> AddPaymendInformationAsync(Guid userId, CreatePaymentInformationRequest request)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid userId input", ErrorCodes.Unauthorized);

            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            var paymentInfor = _mapper.Map<PaymentInformation>(request);
            
            if (paymentInfor == null)
                return ErrorResponse.FailureResult("Failed to map payment information", ErrorCodes.InternalServerError);

            paymentInfor.UserId = userId;

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.PaymentInformationRepository.AddAsync(paymentInfor);
                return Result.Success();
            });
        }

        public async Task<Result> UpdatePaymendInformationAsync(Guid userId, Guid paymentInformationId, UpdatePaymentInformationRequest request)
        {
            if (userId == Guid.Empty || paymentInformationId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            var paymentInfor = await _unitOfWork.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true);
            if (paymentInfor == null || paymentInfor.IsDeleted)
                return ErrorResponse.FailureResult("Payment Infor not found or inactive", ErrorCodes.NotFound);

            _mapper.Map(request, paymentInfor);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.PaymentInformationRepository.UpdateAsync(paymentInfor);
                return Result.Success();
            });
        }

        public async Task<Result> DeletePaymendInformationAsync(Guid userId, Guid paymentInformationId)
        {
            if (userId == Guid.Empty || paymentInformationId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            var paymentInfor = await _unitOfWork.PaymentInformationRepository.GetByIdAsync(paymentInformationId, true);
            if (paymentInfor == null || paymentInfor.IsDeleted)
                return ErrorResponse.FailureResult("Payment Infor not found or inactive", ErrorCodes.NotFound);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.PaymentInformationRepository.DeleteAsync(paymentInfor);
                return Result.Success();
            });
        }

        public async Task<Result<BasePaginated<PaymentInformationResponse>>> GetPaymendInformationsAsync(Guid userId, int pageNumber = 1, int pageSize = 5)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            IQueryable<PaymentInformation> paymentInfors = _unitOfWork.PaymentInformationRepository
                                                            .Query()
                                                            .AsNoTracking()
                                                            .Where(pi => !pi.DeletedAt.HasValue && pi.UserId == userId);
            int totalCount = await paymentInfors.CountAsync();

            var result = await paymentInfors
                .OrderByDescending(pi => pi.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(pi => new PaymentInformationResponse
                {
                    AccountHolderName = pi.AccountHolderName,
                    AccountNumber = pi.AccountNumber,
                    BankName = pi.BankName,
                    BranchName = pi.BranchName,
                    PaymentInformationId = pi.Id,
                    BankBin = pi.BankBin,
                    BankLogo = pi.BankLogo,
                    BankShortName = pi.BankShortName
                })
                .ToListAsync();

            return new BasePaginated<PaymentInformationResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<PaymentInformationResponse>> GetPaymendInformationByIdAsync(Guid userId, Guid paymentInformationId)
        {
            if (userId == Guid.Empty || paymentInformationId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            var paymentInfor = await _unitOfWork.PaymentInformationRepository
                                            .Query()
                                            .Where(pi => pi.Id == paymentInformationId && !pi.IsDeleted)
                                            .ProjectTo<PaymentInformationResponse>(_mapper.ConfigurationProvider)
                                            .FirstOrDefaultAsync();
            if (paymentInfor == null)
                return ErrorResponse.FailureResult("Payment Infor not found or inactive", ErrorCodes.NotFound);
            return Result<PaymentInformationResponse>.Success(paymentInfor);
        }

        public async Task<Result<Payout>> WithdrawAsync(Guid userId, OnlyPayOutRequest request)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid userId", ErrorCodes.InvalidInput);

            var validationResult = ValidationHelper.ValidateModelWithResult(request);
            if (!validationResult.IsSuccess)
                return ErrorResponse.FailureResult(validationResult.Error!.Message, ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);

            if (user == null || user.IsDeleted)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            var wallet = await _unitOfWork.WalletRepository
                .Query()
                .FirstOrDefaultAsync(w => w.UserId == userId && !w.IsDeleted);

            if (wallet == null)
                return ErrorResponse.FailureResult("Wallet not found", ErrorCodes.NotFound);

            if (wallet.Balance < request.Amount)
                return ErrorResponse.FailureResult("Insufficient balance", ErrorCodes.InvalidInput);

            var paymentInfo = await _unitOfWork.PaymentInformationRepository.GetByIdAsync(request.PaymentInfoId, true);
            if (paymentInfo == null || paymentInfo.IsDeleted)
                return ErrorResponse.FailureResult("Payment information not found or inactive", ErrorCodes.NotFound);
            var referenceId = GenerateOrderCode().ToString();
            try
            {
                var amountAfterFees = request.Amount - 4000;
                var payoutRequest = new PayoutRequest
                {
                    ReferenceId = referenceId,
                    Amount = amountAfterFees,
                    Description = request.Description ?? "Rút tiền",
                    ToBin = paymentInfo.BankBin,
                    ToAccountNumber = paymentInfo.AccountNumber,
                    Category = new List<string>{ "Withdraw" }
                };
                var payoutResponse = await _payOSService.CreatePayoutAsync(payoutRequest);

                var result = await _transactionHelper.ExecuteInTransactionAsync(async () =>
                {
                    wallet.Balance -= request.Amount;

                    var transaction = new WalletTransaction
                    {
                        OrderCode = referenceId,
                        WalletId = wallet.Id,
                        Amount = request.Amount,
                        BalanceBefore = wallet.Balance + request.Amount, 
                        BalanceAfter = wallet.Balance,
                        Type = TransactionType.Withdraw,
                        Direction = TransactionDirection.Out,
                        Status = TransactionStatus.Success, 
                        Description = $"{request.Description ?? "Rút tiền"} | PayoutId: {payoutResponse.Id}",
                        ReferenceId = userId,
                        ReferenceType = ReferenceType.WithdrawRequest,
                    };

                    await _unitOfWork.WalletTransactionRepository.AddAsync(transaction);
                    await _unitOfWork.WalletRepository.UpdateAsync(wallet);

                    return Result.Success();
                });

                if (!result.IsSuccess)
                    return ErrorResponse.FailureResult("Failed to update wallet", ErrorCodes.InternalServerError);

                return Result<Payout>.Success(payoutResponse);
            }
            catch (Exception ex)
            {
                var transaction = new WalletTransaction
                {
                    OrderCode = referenceId,
                    WalletId = wallet.Id,
                    Amount = request.Amount,
                    BalanceBefore = wallet.Balance,
                    BalanceAfter = wallet.Balance,
                    Type = TransactionType.Withdraw,
                    Direction = TransactionDirection.Out,
                    Status = TransactionStatus.Failed,
                    Description = ex.Message,
                    ReferenceId = userId,
                    ReferenceType = ReferenceType.WithdrawRequest,
                };
                await _unitOfWork.WalletTransactionRepository.AddAsync(transaction);
                await _unitOfWork.SaveChangesAsync();
                return ErrorResponse.FailureResult($"Withdraw failed: {ex.Message}", ErrorCodes.InternalServerError);
            }
        }
    }
}
