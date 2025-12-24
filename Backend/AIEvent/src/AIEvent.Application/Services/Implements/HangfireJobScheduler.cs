using AIEvent.Application.Services.Interfaces;
using Hangfire;
using Microsoft.Extensions.Logging;

namespace AIEvent.Application.Services.Implements
{
    public class HangfireScheduler : IHangfireScheduler
    {
        private readonly IRecurringJobManager _recurringJobManager; 
        private readonly ILogger<HangfireScheduler> _logger;

        public HangfireScheduler(IRecurringJobManager recurringJobManager, ILogger<HangfireScheduler> logger)
        {
            _recurringJobManager = recurringJobManager;
            _logger = logger;
        }

        public void ScheduleJobs()
        {
            ScheduleJob("auto-complete-expired-events", () =>
            {
                _recurringJobManager.AddOrUpdate<IEventService>(
                    "auto-complete-expired-events",
                    service => service.CompleteExpiredEventsAsync(),
                    "*/1 * * * *");
            });

            ScheduleJob("auto-process-pending-payouts", () =>
            {
                _recurringJobManager.AddOrUpdate<IPaymentService>(
                    "auto-process-pending-payouts",
                    service => service.ProcessPendingPayoutsAsync(),
                    "0 */3 * * *");
            });

            ScheduleJob("auto-process-event-booking-reminder", () =>
            {
                _recurringJobManager.AddOrUpdate<INotificationService>(
                    "auto-process-event-booking-reminder",
                    service => service.SendEventBookingReminderAsync(),
                    "*/5 * * * *");
            });

            ScheduleJob("auto-send-favorite-event-ticket-sale-notification", () =>
            {
                _recurringJobManager.AddOrUpdate<INotificationService>(
                    "auto-send-favorite-event-ticket-sale-notification",
                    service => service.SendFavoriteEventTicketSaleNotificationAsync(),
                    "*/5 * * * *");
            });

            ScheduleJob("auto-process-expired-pending-transactions", () =>
            {
                _recurringJobManager.AddOrUpdate<IPaymentService>(
                    "auto-process-expired-pending-transactions",
                    service => service.ProcessExpiredPendingTransactionsAsync(),
                    "*/5 * * * *");
            });
        }

        private void ScheduleJob(string jobId, Action scheduleAction)
        {
            try
            {
                scheduleAction();
                _logger.LogInformation("Recurring job '{JobId}' scheduled successfully.", jobId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to schedule recurring job '{JobId}'. Other jobs will continue to be scheduled.", jobId);
            }
        }
    }
}
