using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Services.Interfaces;
using Hangfire;
using Microsoft.Extensions.Logging;

namespace AIEvent.Application.Services.Implements
{
    public class HangfireJobService : IHangfireJobService
    {
        private readonly IPdfService _pdfService;
        private readonly IEmailService _emailService;
        private readonly ILogger<HangfireJobService> _logger;

        public HangfireJobService(
        IPdfService pdfService,
        IEmailService emailService,
        ILogger<HangfireJobService> logger)
        {
            _pdfService = pdfService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task EnqueueSendTicketEmailJobAsync(string userEmail, string userFullName, string eventTitle, List<TicketForPdf> tickets)
        {
            // Tạo background job cho Hangfire (không chạy ngay trong luồng hiện tại)
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

                _logger.LogInformation("✅ Sent ticket email for {UserEmail} ({EventTitle})", userEmail, eventTitle);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error sending ticket email for {UserEmail} ({EventTitle})", userEmail, eventTitle);
                throw; // để Hangfire tự retry
            }
        }
    }
}
