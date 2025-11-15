using AIEvent.Application.Services.Interfaces;
using Hangfire;

namespace AIEvent.Application.Services.Implements
{
    public class HangfireScheduler : IHangfireScheduler
    {
        private readonly IRecurringJobManager _recurringJobManager; 

        public HangfireScheduler(IRecurringJobManager recurringJobManager )
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
                "*/5 * * * *");

            _recurringJobManager.AddOrUpdate<INotificationService>(
                "auto-process-event-reminder",
                service => service.SendEventReminderAsync(),
                "*/15 * * * *");
        }
    }
}
