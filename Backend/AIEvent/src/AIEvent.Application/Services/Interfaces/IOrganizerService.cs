using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IOrganizerService
    {
        Task<Result> RegisterOrganizerAsync(Guid userId, RegisterOrganizerRequest request);
        Task<Result<List<OrganizerResponse>>> GetOrganizerAsync(int page = 1, int pageSize = 10);
        Task<Result<OrganizerResponse>> GetOrganizerByIdAsync(string id);
        Task<Result<BasePaginated<ListOrganizerNeedApprove>>> GetListOrganizerNeedApprove(int pageNumber, int pageSize);
        Task<Result<OrganizerResponse>> GetOrgNeedApproveByIdAsync(string id);
        Task<Result> ConfirmBecomeOrganizerAsync(Guid userId, string id, ConfirmRequest request);
    }
}
