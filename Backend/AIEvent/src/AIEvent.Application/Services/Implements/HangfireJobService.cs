using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.RevenueReport;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PayOS.Models.V1.Payouts;

namespace AIEvent.Application.Services.Implements
{
    public class HangfireJobService : IHangfireJobService
    {
        private readonly IPdfService _pdfService;
        private readonly IEmailService _emailService;
        private readonly ILogger<HangfireJobService> _logger;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPayOSService _payOSService;
        private readonly ITransactionHelper _transactionHelper;

        public HangfireJobService(
        IPdfService pdfService,
        IEmailService emailService,
        ILogger<HangfireJobService> logger,
        IUnitOfWork unitOfWork,
        IPayOSService payService,
        ITransactionHelper transactionHelper)
        {
            _pdfService = pdfService;
            _emailService = emailService;
            _logger = logger;
            _unitOfWork = unitOfWork;
            _payOSService = payService;
            _transactionHelper = transactionHelper;
        }

        // send ticket to email
        public async Task EnqueueSendTicketEmailJobAsync(string userEmail, string userFullName, string eventTitle, List<TicketForPdf> tickets)
        {
            BackgroundJob.Enqueue(() => GenerateAndSendTicketEmailAsync(userEmail, userFullName, eventTitle, tickets));
            await Task.CompletedTask;
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task GenerateAndSendTicketEmailAsync(string userEmail, string userFullName, string eventTitle, List<TicketForPdf> tickets)
        {
            try
            {
                // Sinh file PDF
                var pdfBytes = await _pdfService.GenerateTicketsPdfAsync(tickets, eventTitle, userFullName, userEmail);

                // Gửi email
                await _emailService.SendTicketsEmailAsync(
                    userEmail,
                    $"Your Tickets from AIEvent - {eventTitle}",
                    null!,
                    pdfBytes,
                    $"{userFullName}-AIEvent",
                    eventTitle
                );

                _logger.LogInformation("Sent ticket email for {UserEmail} ({EventTitle})", userEmail, eventTitle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending ticket email for {UserEmail} ({EventTitle})", userEmail, eventTitle);
                throw;
            }
        }

        // payout for organizer
        public async Task EnqueueOrganizerPayoutJobAsync(RevenueReportRequest request, string eventName)
        {
            BackgroundJob.Schedule(() => ProcessOrganizerPayoutAsync(request), TimeSpan.FromDays(10));
            await Task.CompletedTask;
        }

        private static long GenerateOrderCode()
        {
            var random = new Random();
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var randomPart = random.Next(100, 999);
            return long.Parse($"{timestamp}{randomPart}");
        }

        [AutomaticRetry(Attempts = 3)]
        public async Task ProcessOrganizerPayoutAsync(RevenueReportRequest request)
        {
            try
            {
                var existingReport = await _unitOfWork.RevenueReportRepository
                    .Query()
                    .AsNoTracking()
                    .AnyAsync(r => r.EventId == request.EventId && !r.IsDeleted);

                if (existingReport)
                {
                    _logger.LogWarning("RevenueReport already exists for Event {EventId}, skipping", request.EventId);
                    return;
                }
                const decimal platformFeePercent = 0.066m;
                const decimal platformFixedFee = 45000m;

                var platformFee = request.TotalAmount * platformFeePercent + platformFixedFee;
                var payoutAmount = request.TotalAmount - platformFee;

                if (payoutAmount < 0)
                {
                    _logger.LogWarning("Event {EventId}: payoutAmount < 0, skipping payout", request.EventId);
                    return;
                }

                var paymentInfor = await _unitOfWork.PaymentInformationRepository
                    .Query()
                    .AsNoTracking()
                    .Select(u => new {u.Id, u.AccountNumber, u.BankBin, u.IsDeleted })
                    .FirstOrDefaultAsync(p => p.Id == request.PaymentInforId && !p.IsDeleted);

                if (paymentInfor == null)
                {
                    _logger.LogError("PaymentInformation of Organizer not found");
                    return;
                }
                var result = await _transactionHelper.ExecuteInTransactionAsync(async () =>
                {
                    // chuyen tien
                    var referenceId = GenerateOrderCode().ToString();
                    var payoutRequest = new PayoutRequest
                    {
                        ReferenceId = referenceId,
                        Amount = (long)payoutAmount,
                        Description = $"Chuyển tiền doanh thu sự kiện '{request.EventName}' sau khi trừ {platformFee}VND phí nền tảng AIEvent",
                        ToBin = paymentInfor.BankBin,
                        ToAccountNumber = paymentInfor.AccountNumber,
                        Category = new List<string> { "Payout" }
                    };

                    var payoutResponse = await _payOSService.CreatePayoutAsync(payoutRequest);

                    // create report
                    var payoutDate = request.ConfirmDate.AddDays(10);
                    RevenueReport revenueReport = new()
                    {
                        OrganizerProfileId = request.OrganizerProfileId,
                        EventId = request.EventId,
                        EventName = request.EventName,
                        GrossRevenue = request.TotalAmount,
                        PlatformFee = platformFee,
                        NetRevenue = payoutAmount,
                        ReportMonth = payoutDate.Month,
                        ReportYear = payoutDate.Year,
                        PayoutDate = payoutDate,
                    };

                    await _unitOfWork.RevenueReportRepository.AddAsync(revenueReport);

                    return Result.Success();
                });

                if (result.IsSuccess)
                {
                    _logger.LogInformation(
                        "Payout processed for Organizer {OrganizerId}, Event {EventId}: Total = {TotalAmount:N0}, Fee = {PlatformFee:N0}, Net = {PayoutAmount:N0}",
                        request.OrganizerProfileId, request.EventId, request.TotalAmount, platformFee, payoutAmount
                    );
                }
               
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payout for Organizer {OrganizerId} (Event {EventId})", request.OrganizerProfileId, request.EventId);
                throw;
            }
        }
        public async Task EnqueueCancelEventJobAsync(Guid eventId, string reasonCancel)
        {
            BackgroundJob.Enqueue(() => ProcessCancelEventJobAsync(eventId, reasonCancel));
            await Task.CompletedTask;
        }


        [AutomaticRetry(Attempts = 3)]
        public async Task ProcessCancelEventJobAsync(Guid eventId, string reasonCancel)
        {
            try
            {
                _logger.LogInformation("Starting cancellation job for event {EventId}", eventId);

                var existingEvent = await _unitOfWork.EventRepository
                    .Query()
                    .Include(e => e.Bookings)
                        .ThenInclude(b => b.User)
                        .ThenInclude(u => u.Wallet)
                    .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

                if (existingEvent == null)
                {
                    _logger.LogWarning("Event not found: {EventId}", eventId);
                    return;
                }

                var hasBookings = existingEvent.Bookings
                    .Where(b => b.Status == BookingStatus.Completed || b.Status == BookingStatus.Pending)
                    .ToList();

                await _transactionHelper.ExecuteInTransactionAsync(async () =>
                {
                    if (!hasBookings.Any())
                    {
                        await _unitOfWork.EventRepository.DeleteAsync(existingEvent);
                        await _unitOfWork.SaveChangesAsync();
                        _logger.LogInformation("Deleted event {EventId} without bookings.", eventId);
                        return Result.Success();
                    }

                    var walletTransactions = new List<WalletTransaction>();
                    var paymentTransactions = new List<PaymentTransaction>();
                    var bookingsToUpdate = new List<Booking>();
                    var walletsToUpdate = new List<Wallet>();

                    foreach (var booking in hasBookings)
                    {
                        if (booking.TotalAmount <= 0)
                        {
                            booking.Status = BookingStatus.Cancelled;
                            bookingsToUpdate.Add(booking);
                            continue;
                        }

                        var userWallet = booking.User.Wallet;
                        if (userWallet == null)
                            throw new Exception($"Wallet not found for user {booking.User.FullName}");

                        if (existingEvent.TotalAmount < booking.TotalAmount)
                            throw new Exception($"Event wallet has insufficient balance to refund {booking.TotalAmount}");

                        paymentTransactions.Add(new PaymentTransaction
                        {
                            BookingId = booking.Id,
                            UserId = booking.UserId,
                            Amount = booking.TotalAmount,
                            PaymentMethod = PaymentMethod.Wallet,
                            Status = TransactionStatus.Success,
                            Description = $"Hoàn tiền do hủy sự kiện '{existingEvent.Title}'. Lý do: {reasonCancel} cho người dùng {booking.User.FullName ?? booking.User.Email}",
                            TransactionType = TransactionType.Refund,
                            CompletedAt = DateTime.UtcNow
                        });

                        walletTransactions.Add(new WalletTransaction
                        {
                            WalletId = userWallet.Id,
                            Amount = booking.TotalAmount,
                            BalanceBefore = userWallet.Balance,
                            BalanceAfter = userWallet.Balance + booking.TotalAmount,
                            Type = TransactionType.Refund,
                            Direction = TransactionDirection.In,
                            ReferenceId = booking.Id,
                            ReferenceType = ReferenceType.Refund,
                            Status = TransactionStatus.Success,
                            Description = $"Hoàn tiền do hủy sự kiện '{existingEvent.Title}'. Lý do: {reasonCancel}"
                        });

                        userWallet.Balance += booking.TotalAmount;
                        existingEvent.TotalAmount -= booking.TotalAmount;

                        if (!walletsToUpdate.Any(w => w.Id == userWallet.Id))
                            walletsToUpdate.Add(userWallet);

                        booking.Status = BookingStatus.Cancelled;
                        bookingsToUpdate.Add(booking);
                    }

                    await _unitOfWork.PaymentTransactionRepository.AddRangeAsync(paymentTransactions);
                    await _unitOfWork.WalletTransactionRepository.AddRangeAsync(walletTransactions);
                    await _unitOfWork.WalletRepository.UpdateRangeAsync(walletsToUpdate);
                    await _unitOfWork.BookingRepository.UpdateRangeAsync(bookingsToUpdate);

                    existingEvent.ReasonCancel = reasonCancel;
                    existingEvent.Status = EventStatus.Cancelled;
                    existingEvent.Publish = false;
                    await _unitOfWork.EventRepository.UpdateAsync(existingEvent);
                    _logger.LogInformation("Refunds and cancellations processed for event {EventId}", eventId);
                    return Result.Success();
                });

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing cancel event {EventId}", eventId);
                throw;
            }
        }

    }
}
