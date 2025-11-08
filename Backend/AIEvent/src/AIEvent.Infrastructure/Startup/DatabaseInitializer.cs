using AIEvent.Infrastructure.Context;
using AIEvent.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace AIEvent.Infrastructure.Startup
{
    public class DatabaseInitializer : IHostedService
    {
        private readonly IServiceProvider _serviceProvider;
        public DatabaseInitializer(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<DatabaseContext>();

            await EnsureStoredProceduresAsync(context);
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        private async Task EnsureStoredProceduresAsync(DatabaseContext context)
        {
            var procedures = new[]
            {
                ("usp_GetAdminDashboardSummary", StoreProcedureScripts.GetAdminDashboardSummary),
                ("usp_GetAdminUsers", StoreProcedureScripts.GetAdminUsers),
                ("usp_GetAdminEvents", StoreProcedureScripts.GetAdminEvents),
                ("usp_GetAdminEventCheckInList", StoreProcedureScripts.GetAdminEventCheckInList),
                ("usp_GetAdminFinancialSummary", StoreProcedureScripts.GetAdminFinancialSummary),
                ("usp_GetAdminWithdrawRequests", StoreProcedureScripts.GetAdminWithdrawRequests),
            };

            foreach (var (name, script) in procedures)
            {
                var exists = await context.Database
                    .SqlQueryRaw<int>("SELECT 1 FROM sys.procedures WHERE name = @Name",
                        new SqlParameter("@Name", name))
                    .AnyAsync();

                if (!exists)
                    await context.Database.ExecuteSqlRawAsync(script);
            }
        }
    }
}
