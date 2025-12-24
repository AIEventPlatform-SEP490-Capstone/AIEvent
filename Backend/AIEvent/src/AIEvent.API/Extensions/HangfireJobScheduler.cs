using AIEvent.Application.Services.Interfaces;

namespace AIEvent.API.Extensions
{
    public class HangfireJobScheduler : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<HangfireJobScheduler> _logger;
        private bool _hasScheduled = false;

        public HangfireJobScheduler(IServiceScopeFactory scopeFactory, ILogger<HangfireJobScheduler> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(3000, stoppingToken); 

            if (_hasScheduled)
            {
                _logger.LogInformation("Hangfire jobs already scheduled, skipping...");
                return;
            }

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var scheduler = scope.ServiceProvider.GetRequiredService<IHangfireScheduler>();
                scheduler.ScheduleJobs();
                _hasScheduled = true;
                _logger.LogInformation("Hangfire recurring jobs scheduling completed. Jobs will run automatically according to their cron schedules.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during Hangfire jobs scheduling. Jobs that were successfully scheduled will continue to run.");
                _hasScheduled = true; 
            }
        }
    }
}
