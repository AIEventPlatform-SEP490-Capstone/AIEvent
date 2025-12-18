using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.DTOs.Payment;
using AIEvent.Application.DTOs.PaymentInformation;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;
        private readonly ILogger<PaymentService> _logger;
        public PaymentService(IUnitOfWork unitOfWork, IConfiguration configuration, ITransactionHelper transactionHelper, IPayOSService payOSService, IMapper mapper, INotificationService notificationService, ILogger<PaymentService> logger)
        {
            _unitOfWork = unitOfWork;
            _configuration = configuration;
            _transactionHelper = transactionHelper;
            _payOSService = payOSService;
            _mapper = mapper;
            _logger = logger;
            _notificationService = notificationService;
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
                    PaymentUrl = result.CheckoutUrl,
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

        public async Task<Result> AddPaymendInformationAsync(Guid userId, PaymentInformationRequest request)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid userId input", ErrorCodes.Unauthorized);

            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted)
                return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);

            var userPaymentList = await _unitOfWork.PaymentInformationRepository
                                            .Query()
                                            .Where(pi => pi.UserId == userId && !pi.IsDeleted)
                                            .ToListAsync();

            if (userPaymentList.Any())
                return ErrorResponse.FailureResult("Only one payment information is allowed", ErrorCodes.InvalidInput);

            if (userPaymentList.Any(pi => pi.AccountNumber == request.AccountNumber))
                return ErrorResponse.FailureResult("This account number is already in use", ErrorCodes.InvalidInput);

            var paymentInfo = _mapper.Map<PaymentInformation>(request);
            
            if (paymentInfo == null)
                return ErrorResponse.FailureResult("Account number already exists", ErrorCodes.InternalServerError);

            paymentInfo.UserId = userId;

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.PaymentInformationRepository.AddAsync(paymentInfo);
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

            _unitOfWork.DisableSoftDelete();
            await _unitOfWork.PaymentInformationRepository.DeleteAsync(paymentInfor);
            await _unitOfWork.SaveChangesAsync();
            _unitOfWork.EnableSoftDelete();
            return Result.Success();
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
                        Description = $"{request.Description?.Trim() ?? "Rút tiền"}<br>" +
                          $"Tên tài khoản nhận: {paymentInfo.AccountHolderName?.Trim() ?? "Không xác định"}<br>" +
                          $"Số tài khoản nhận: {paymentInfo.AccountNumber?.Trim() ?? "Không xác định"}",
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

        public async Task ProcessPendingPayoutsAsync()
        {
                var allSettings = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted)
                    .OrderByDescending(s => s.UpdatedAt)               
                    .ToListAsync();

                if (!allSettings.Any())
                {
                    _logger.LogError("SystemSetting not found for ProcessPendingPayoutsAsync");
                    return;
                }

                var settingCache = new Dictionary<string, SystemSetting>();

                var defaultSetting = allSettings.First();

                var pendingEvents = await _unitOfWork.EventRepository
                    .Query()
                    .Include(e => e.OrganizerProfile)
                    .Where(e => e.Status == EventStatus.WaitingForPayout
                                && e.PayoutAttemptCount < 7
                                && !e.IsDeleted)
                    .OrderBy(e => e.CompletedAt)
                    .Take(200)              
                    .ToListAsync();

                if (!pendingEvents.Any())
                {
                    _logger.LogInformation("No events ready for payout.");
                    return;
                }
 
                pendingEvents = pendingEvents
                    .Where(ev =>
                    {
                        var key = ev.SaleStartTime!.Value.ToString("yyyy-MM-dd");

                        if (!settingCache.TryGetValue(key, out var setting))
                        {
                             setting = allSettings
                                .Where(s => s.UpdatedAt <= ev.SaleStartTime)
                                .OrderByDescending(s => s.UpdatedAt)
                                .FirstOrDefault()
                                ?? defaultSetting;

                            settingCache[key] = setting;
                        }

                        var deadline = DateTime.UtcNow.AddDays(-setting.DatePayout);
                        return ev.CompletedAt <= deadline;
                    })
                    .Take(50)
                    .ToList();

                if (!pendingEvents.Any())
                {
                    _logger.LogInformation("No events meet payout deadline after applying month-based SystemSetting.");
                    return;
                }

            var managerRole = await _unitOfWork.RoleRepository
                                    .Query()
                                    .AsNoTracking()
                                    .Where(r => r.Name == "Manager" && !r.IsDeleted)
                                    .Select(r => r.Id)
                                    .FirstOrDefaultAsync();

            foreach (var ev in pendingEvents)
                {
                    var key = ev.SaleStartTime!.Value.ToString("yyyy-MM-dd");

                    if (!settingCache.TryGetValue(key, out var setting))
                    {
                        setting = allSettings
                            .Where(s => s.UpdatedAt <= ev.SaleStartTime)
                            .OrderByDescending(s => s.UpdatedAt)
                            .FirstOrDefault()
                            ?? defaultSetting;

                        settingCache[key] = setting;
                    }

                    decimal platformFeePercent = setting.FlatformFee;
                    decimal platformFixedFee = setting.FixFee;

                    if (ev.Status != EventStatus.WaitingForPayout ||
                            ev.OrganizerProfile == null ||
                            ev.TotalAmount <= 0)
                    {
                        _logger.LogWarning("Event {EventId} is Cancelled or ErrorPayment, skipping payout", ev.Id);
                        continue;
                    }
                     
                    ev.PayoutAttemptCount++;
                         
                    if (ev.PayoutAttemptCount >= 7)
                    { 
                        if (ev.OrganizerProfile != null)
                        {
                            await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                            {
                                UserId = ev.OrganizerProfile.UserId,
                                Title = "Cảnh báo: Dừng thực hiện payout",
                                Message = $"Sự kiện <strong>{ev.Title}</strong> đã thực hiện payout đạt {ev.PayoutAttemptCount} lần. Hệ thống sẽ dừng thực hiện giao dịch payout cho sự kiện này. Sự kiện đã được chuyển sang trạng thái ErrorPayment. Vui lòng liên hệ hỗ trợ.",
                                Type = NotificationType.System,
                                EventId = ev.Id
                            });
                        }
                        
                        if (managerRole != Guid.Empty)
                        {
                            var managerUsers = await _unitOfWork.UserRepository
                                .Query()
                                .AsNoTracking()
                                .Where(u => u.RoleId == managerRole && !u.IsDeleted && u.IsActive)
                                .Select(u => u.Id)
                                .ToListAsync();
                            
                            foreach (var managerId in managerUsers)
                            {
                                await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                                {
                                    UserId = managerId,
                                    Title = "Cảnh báo: Dừng thực hiện payout",
                                    Message = $"Sự kiện <strong>{ev.Title}</strong> (ID: {ev.Id}) đã thực hiện payout đạt {ev.PayoutAttemptCount} lần. Hệ thống đã dừng thực hiện giao dịch payout cho sự kiện này và chuyển sang trạng thái ErrorPayment. Vui lòng kiểm tra và xử lý.",
                                    Type = NotificationType.System,
                                    EventId = ev.Id
                                });
                            }
                        }
                         
                        ev.Status = EventStatus.ErrorPayment;
                        ev.ReasonCancel = $"Sự kiện bị hủy do đã thực hiện payout đạt {ev.PayoutAttemptCount} lần.";
                        
                        await _unitOfWork.EventRepository.UpdateAsync(ev);
                        await _unitOfWork.SaveChangesAsync(); 
                        continue;
                    }
                    
                    var paymentInfor = await _unitOfWork.PaymentInformationRepository
                        .Query()
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.UserId == ev.OrganizerProfile!.UserId && !p.IsDeleted);

                    var hasBeenPaid = await _unitOfWork.RevenueReportRepository
                        .Query()
                        .AnyAsync(r => r.EventId == ev.Id && r.PayoutDate != null && !r.IsDeleted);
                     
                    if (hasBeenPaid)
                    {
                        _logger.LogInformation("Event {EventId} already paid out.", ev.Id); 
                        continue;
                    }
                     
                    if (paymentInfor == null)
                    { 
                        var hasWarned = await _unitOfWork.NotificationRepository
                            .Query()
                            .AnyAsync(n => n.EventId == ev.Id
                                          && n.Type == NotificationType.PayoutFailed
                                          && !n.IsDeleted);

                        if (!hasWarned)
                        {
                            await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                            {
                                UserId = ev.OrganizerProfile!.UserId,
                                Title = "Doanh thu chưa được chuyển",
                                Message = $"Sự kiện <strong>{ev.Title}</strong> chưa thể chuyển tiền do chưa có thông tin ngân hàng. Vui lòng cập nhật thông tin để nhận thanh toán.",
                                Type = NotificationType.PayoutFailed, 
                                EventId = ev.Id
                            });
                            _logger.LogInformation("Sent payout warning for Event {EventId} (no payment info)", ev.Id);
                        } 
                        continue;
                    }
                     
                    var platformFee = ev.TotalAmount * platformFeePercent + platformFixedFee;
                    var payoutAmount = (long)(ev.TotalAmount - platformFee);

                    if (payoutAmount <= 0)
                    {
                        _logger.LogWarning("Payout amount negative for Event {EventId}: {Amount}", ev.Id, payoutAmount);
                        continue;
                    }

                    var referenceId = GenerateOrderCode().ToString();
                    var payoutRequest = new PayoutRequest
                    {
                        ReferenceId = referenceId,
                        Amount = (long)payoutAmount,
                        Description = "Thanh toán sự kiện",
                        ToBin = paymentInfor.BankBin,
                        ToAccountNumber = paymentInfor.AccountNumber,
                        Category = new List<string> { "Payout" }
                    };

                    var payoutResponse = await _payOSService.CreatePayoutAsync(payoutRequest);
                    var payoutDate = DateTime.UtcNow;
                    if (payoutResponse.ApprovalState != PayoutApprovalState.Completed)
                    {
                        _logger.LogError("Payout transaction failed for Event {EventId}", ev.Id);
                        await _unitOfWork.EventRepository.UpdateAsync(ev);
                        await _unitOfWork.SaveChangesAsync();
                        continue;
                    }

                    var result = await _transactionHelper.ExecuteInTransactionAsync(async () =>
                    {
                         
                        var revenueReport = new RevenueReport
                        {
                            OrganizerProfileId = ev.OrganizerProfileId,
                            EventId = ev.Id,
                            EventName = ev.Title,
                            GrossRevenue = ev.TotalAmount,
                            PlatformFee = platformFee,
                            NetRevenue = payoutAmount,
                            ReportMonth = payoutDate.Month,
                            ReportYear = payoutDate.Year,
                            PayoutDate = payoutDate
                        };

                        await _unitOfWork.RevenueReportRepository.AddAsync(revenueReport);
                        return Result.Success();
                    });

                    if (!result.IsSuccess)
                    {
                        _logger.LogError("Payout transaction failed for Event {EventId}", ev.Id); 
                        continue;
                    }
                         
                    ev.Status = EventStatus.PaidOut;
                    ev.PaidOutAt = DateTime.UtcNow;
                    await _unitOfWork.EventRepository.UpdateAsync(ev);
                    await _unitOfWork.SaveChangesAsync();
                     
                    await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
                    {
                        UserId = ev.OrganizerProfile!.UserId,
                        Title = "Doanh thu đã được chuyển",
                        Message = $"Sự kiện <strong>{ev.Title}</strong> đã được chuyển <strong>{payoutAmount:N0} VND</strong> vào tài khoản.",
                        Type = NotificationType.PayoutCompleted, 
                        EventId = ev.Id
                    });

                    _logger.LogInformation("Payout success: Event {EventId} ({Title}) → {Amount:N0} VND", ev.Id, ev.Title, payoutAmount);
                }
        }

        public async Task ProcessExpiredPendingTransactionsAsync()
        {
            try
            { 
                var expiredTime = DateTime.UtcNow.AddMinutes(-15);
                var pendingTransactions = await _unitOfWork.WalletTransactionRepository
                    .Query()
                    .Where(t => t.Status == TransactionStatus.Pending
                                && t.CreatedAt <= expiredTime
                                && !t.IsDeleted)
                    .ToListAsync();

                if (!pendingTransactions.Any())
                {
                    _logger.LogInformation("No expired pending transactions found.");
                    return;
                }
 
                var transactionUpdate = new List<WalletTransaction>();
                foreach (var transaction in pendingTransactions)
                {
                    try
                    {
                        transaction.Status = TransactionStatus.Failed;
                        if (string.IsNullOrEmpty(transaction.Description))
                            transaction.Description = "Giao dịch đã hết hạn (quá 15 phút)";
                        else
                            transaction.Description += ". Giao dịch đã hết hạn (quá 15 phút)";
  
                        transactionUpdate.Add(transaction);
                        _logger.LogInformation("Expired pending transaction {TransactionId} marked as Failed", transaction.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to update expired transaction {TransactionId}", transaction.Id);
                    }
                }
                if(transactionUpdate.Any())
                    await _unitOfWork.WalletTransactionRepository.UpdateRangeAsync(transactionUpdate);

                await _unitOfWork.SaveChangesAsync(); 
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ProcessExpiredPendingTransactionsAsync job");
                throw;
            }
        }
    }
}
