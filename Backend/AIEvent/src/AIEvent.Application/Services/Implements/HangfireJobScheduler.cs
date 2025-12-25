using AIEvent.Application.Services.Interfaces;
using Hangfire;

namespace AIEvent.Application.Services.Implements
{
    public class HangfireScheduler : IHangfireScheduler
    {
        private readonly IRecurringJobManager _recurringJobManager; 

        public HangfireScheduler(IRecurringJobManager recurringJobManager)
        {
            _recurringJobManager = recurringJobManager;
        }

        public void ScheduleJobs()
        {
            _recurringJobManager.AddOrUpdate<IEventService>(
                    "auto-complete-expired-events",
                    service => service.CompleteExpiredEventsAsync(),
                    "*/1 * * * *");

            _recurringJobManager.AddOrUpdate<IPaymentService>(
                    "auto-process-pending-payouts",
                    service => service.ProcessPendingPayoutsAsync(),
                    "0 */3 * * *");

            _recurringJobManager.AddOrUpdate<INotificationService>(
                    "auto-process-event-booking-reminder",
                    service => service.SendEventBookingReminderAsync(),
                    "*/5 * * * *");

            _recurringJobManager.AddOrUpdate<INotificationService>(
                    "auto-send-favorite-event-ticket-sale-notification",
                    service => service.SendFavoriteEventTicketSaleNotificationAsync(),
                    "*/5 * * * *");

            _recurringJobManager.AddOrUpdate<IPaymentService>(
                    "auto-process-expired-pending-transactions",
                    service => service.ProcessExpiredPendingTransactionsAsync(),
                    "*/5 * * * *");
        }
    }
}
