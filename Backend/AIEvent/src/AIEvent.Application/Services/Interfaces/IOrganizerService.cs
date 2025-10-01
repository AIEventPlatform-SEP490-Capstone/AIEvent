using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IOrganizerService
    {
        Task<Result> RegisterOrganizerAsync(Guid userId, RegisterOrganizerRequest request);
        //Task<Result<List<OrganizerResponse>>> GetOrganizerAsync(int page = 1, int pageSize = 10);
        //Task<Result<OrganizerResponse>> GetOrganizerByIdAsync(string id);
    }
}
