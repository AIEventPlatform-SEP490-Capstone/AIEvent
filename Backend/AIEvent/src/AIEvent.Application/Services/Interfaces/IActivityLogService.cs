using AIEvent.Application.DTOs.User;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IActivityLogService
    {
        Task SaveAsync(ActivityLog log);
        Task<Result<BasePaginated<ActivityLogResponse>>> GetActivityLogsByUserAsync(string id, DateTimeOffset? startDate, DateTimeOffset? endDate,
                                                                                                 int pageNumber, int pageSize);
    }
}
