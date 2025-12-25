using AIEvent.Application.Services.Interfaces;
using Hangfire;
using Hangfire.Storage;

namespace AIEvent.API.Extensions
{
    public class HangfireJobScheduler : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<HangfireJobScheduler> _logger;

        public HangfireJobScheduler(IServiceScopeFactory scopeFactory, ILogger<HangfireJobScheduler> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(3000, stoppingToken); 
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var connection = JobStorage.Current.GetConnection();

                using var distributedLock =
                    connection.AcquireDistributedLock("hangfire-job-scheduler-lock", TimeSpan.FromMinutes(5));

                var scheduler = scope.ServiceProvider.GetRequiredService<IHangfireScheduler>();
                scheduler.ScheduleJobs();
                _logger.LogInformation("Hangfire recurring jobs scheduling completed. Jobs will run automatically according to their cron schedules.");
            }
            catch (DistributedLockTimeoutException)
            {
                _logger.LogInformation("Another instance already scheduled Hangfire jobs. Skipping...");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during Hangfire jobs scheduling. Jobs that were successfully scheduled will continue to run.");
            }
        }
    }
}
