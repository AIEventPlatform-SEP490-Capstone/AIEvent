using AIEvent.Application.Services.Interfaces;
using Hangfire;
using Hangfire.Storage;

namespace AIEvent.API.Extensions
{
    public class HangfireJobScheduler : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<HangfireJobScheduler> _logger;

        private const int LockTimeoutSeconds = 59;    
        private const int RetryDelaySeconds = 10;       
        private const int MaxRetryCount = 3;           

        public HangfireJobScheduler(IServiceScopeFactory scopeFactory, ILogger<HangfireJobScheduler> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(3000, stoppingToken); 

            int retryCount = 0;

            while (!stoppingToken.IsCancellationRequested && retryCount < MaxRetryCount)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var connection = JobStorage.Current.GetConnection();
                    const string lockKey = "hangfire:jobs:scheduled:lock";

                    try
                    {
                        using (connection.AcquireDistributedLock(lockKey, TimeSpan.FromSeconds(LockTimeoutSeconds)))
                        {
                            var scheduler = scope.ServiceProvider.GetRequiredService<IHangfireScheduler>();
                            scheduler.ScheduleJobs();
                            _logger.LogInformation("Hangfire recurring jobs scheduled successfully.");
                        }

                        break; 
                    }
                    catch (DistributedLockTimeoutException)
                    {
                        _logger.LogInformation("Another instance already scheduled Hangfire jobs, skipping...");
                        break; 
                    }
                }
                catch (Exception ex)
                {
                    retryCount++;
                    _logger.LogError(ex, "Error scheduling Hangfire jobs. Retry {RetryCount}/{MaxRetryCount} in {DelaySeconds}s...", retryCount, MaxRetryCount, RetryDelaySeconds);
                    await Task.Delay(TimeSpan.FromSeconds(RetryDelaySeconds), stoppingToken);
                }
            }
        }
    }
}
