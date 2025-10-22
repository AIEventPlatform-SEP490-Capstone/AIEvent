using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface ITagService
    {
        Task<Result> CreateTagAsync(CreateTagRequest request);
        Task<Result<BasePaginated<TagResponse>>> GetListTagAsync(int pageNumber, int pageSize);
        Task<Result> DeleteTagAsync(string id);
        Task<Result<TagResponse>> GetTagByIdAsync(string id);
        Task<Result<TagResponse>> UpdateTagAsync(string id, UpdateTagRequest request);
        Task<Result<BasePaginated<TagResponse>>> GetListTagByUserIdAsync(int pageNumber, int pageSize, Guid userId);
    }
}
