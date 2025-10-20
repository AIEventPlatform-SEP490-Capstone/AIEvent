using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IOrganizerService
    {
        Task<Result> RegisterOrganizerAsync(Guid userId, RegisterOrganizerRequest request);
        Task<Result<OrganizerDetailResponse>> GetOrganizerByIdAsync(Guid id);
        Task<Result<BasePaginated<OrganizerResponse>>> GetOrganizerAsync(int pageNumber = 1, int pageSize = 10, bool? needApprove = false);
        Task<Result> ConfirmBecomeOrganizerAsync(Guid userId, Guid organizerProfileId, ConfirmRequest request);
    }
}
