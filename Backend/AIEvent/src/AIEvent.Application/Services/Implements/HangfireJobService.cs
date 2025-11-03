using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.RevenueReport;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
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
                // 1️⃣ Sinh file PDF
                var pdfBytes = await _pdfService.GenerateTicketsPdfAsync(tickets, eventTitle, userFullName, userEmail);

                // 2️⃣ Gửi email
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
                throw; // để Hangfire tự retry
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

    }
}
