using AIEvent.Application.Services.Interfaces;

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

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var scheduler = scope.ServiceProvider.GetRequiredService<IHangfireScheduler>();
                    scheduler.ScheduleJobs();

                    _logger.LogInformation("Hangfire recurring jobs scheduled successfully.");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error scheduling Hangfire jobs. Retrying in 10s...");
                    await Task.Delay(10000, stoppingToken);
                }
            }
        }
    }
}
