using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface ITagService
    {
        Task<Result> CreateTagAsync(CreateTagRequest request);
        Task<Result<BasePaginated<TagResponse>>> GetListTagAsync(int pageNumber, int pageSize);
    }
}
