using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IOrganizerService
    {
        Task<Result> RegisterOrganizerAsync(Guid userId, RegisterOrganizerRequest request);
        Task<Result<OrganizerDetailResponse>> GetOrganizerByIdAsync(Guid id);
        Task<Result<BasePaginated<OrganizerResponse>>> GetOrganizerAsync(int pageNumber = 1, int pageSize = 10, OrganizerProfileStatus? status = null);
        Task<Result> ConfirmBecomeOrganizerAsync(Guid userId, Guid organizerProfileId, ConfirmOrganizerRequest request);
        Task<Result<OrganizerDetailResponse>> GetOrganizerProfileAsync(Guid userId);
        Task<Result<object>> UpdateOrganizerProfileAsync(Guid userId, UpdateOrganizerProfileRequest request);
        Task<Result<BasePaginated<OrganizerWithFlagsResponse>>> GetOrganizersWithFlagsAsync(Guid? organizerId = null, int? minFlags = null, int pageNumber = 1, int pageSize = 10);
    }
}
