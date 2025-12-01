using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities; 
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AIEvent.Application.Services.Implements
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public ActivityLogService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public async Task SaveAsync(ActivityLog log)
        {
            using var scope = _scopeFactory.CreateScope();

            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            await unitOfWork.ActivityLogRepository.AddAsync(log);
            await unitOfWork.SaveChangesAsync();
        }

        public async Task<Result<BasePaginated<ActivityLogResponse>>> GetActivityLogsByUserAsync(
            string id,
            DateTimeOffset? startDate,
            DateTimeOffset? endDate,
            int pageNumber,
            int pageSize)
        {
            if (!Guid.TryParse(id, out var userId))
                return ErrorResponse.FailureResult("Invalid ticket ID format", ErrorCodes.InvalidInput);

            using var scope = _scopeFactory.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

            var query = unitOfWork.ActivityLogRepository
                .Query()
                .AsNoTracking()
                .Where(x => x.UserId == userId);

            if (startDate.HasValue)
                query = query.Where(x => x.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(x => x.CreatedAt <= endDate.Value);

            var totalCount = await query.CountAsync();

            var logs = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new ActivityLogResponse
                {
                    Id = x.Id,
                    Path = x.Path,
                    Method = x.Method,
                    Query = x.Query,
                    Body = x.Body,
                    IpAddress = x.IpAddress,
                    UserAgent = x.UserAgent,
                    StatusCode = x.StatusCode,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            return new BasePaginated<ActivityLogResponse>(logs, totalCount, pageNumber, pageSize);
        }

    }
}
