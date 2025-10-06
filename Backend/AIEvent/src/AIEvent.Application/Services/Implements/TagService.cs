using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class TagService : ITagService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;

        public TagService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper)
        {
            _transactionHelper = transactionHelper;
            _unitOfWork = unitOfWork;  
        }

        public async Task<Result> CreateTagAsync(CreateTagRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var existingTag = await _unitOfWork.TagRepository
                                            .Query()
                                            .AsNoTracking()
                                            .FirstOrDefaultAsync(t => t.NameTag.ToLower() == request.NameTag.ToLower());
                if(existingTag != null)
                {
                    return ErrorResponse.FailureResult("Tag is already existing", ErrorCodes.InvalidInput);
                }

                Tag tag = new()
                {
                    NameTag = request.NameTag,
                };

                await _unitOfWork.TagRepository.AddAsync(tag);

                return Result.Success();
            });
        }

        public async Task<Result<BasePaginated<TagResponse>>> GetListTagAsync(int pageNumber, int pageSize)
        {
            IQueryable<Tag> tagQuery = _unitOfWork.TagRepository
                .Query()
                .AsNoTracking()
                .Where(p => !p.DeletedAt.HasValue)
                .OrderByDescending(s => s.CreatedAt);

            int totalCount = await tagQuery.CountAsync();

            var result = await tagQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new TagResponse
                {
                    TagId = p.Id.ToString(),
                    TagName = p.NameTag,
                })
                .ToListAsync();

            return new BasePaginated<TagResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> DeleteTagAsync(string id)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var tagId = Guid.Parse(id);
                var existingTag = await _unitOfWork.TagRepository
                                            .Query()
                                            .FirstOrDefaultAsync(t => t.Id == tagId);

                if (existingTag == null || existingTag.DeletedAt.HasValue)
                {
                    return ErrorResponse.FailureResult("Can not found or Tag is deleted", ErrorCodes.InvalidInput);
                }

                await _unitOfWork.TagRepository.DeleteAsync(existingTag);

                return Result.Success();
            });
        }

        public async Task<Result<TagResponse>> GetTagByIdAsync(string id)
        {
            var tagId = Guid.Parse(id);
            var tag = await _unitOfWork.TagRepository
                                .Query()    
                                .AsNoTracking()
                                .FirstOrDefaultAsync(t => t.Id == tagId);

            if (tag == null || tag.DeletedAt.HasValue)
            {
                return ErrorResponse.FailureResult("Can not found or Tag is deleted", ErrorCodes.InvalidInput);
            }

            TagResponse tagResponse = new()
            {
                TagId = tag.Id.ToString(),
                TagName = tag.NameTag,
            };

            return Result<TagResponse>.Success(tagResponse);
        }

        public async Task<Result<TagResponse>> UpdateTagAsync(string id, UpdateTagRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var tagId = Guid.Parse(id);
                var tag = await _unitOfWork.TagRepository
                                            .Query()
                                            .FirstOrDefaultAsync(t => t.Id == tagId);

                if (tag == null || tag.DeletedAt.HasValue)
                {
                    return ErrorResponse.FailureResult("Can not found or Tag is deleted", ErrorCodes.InvalidInput);
                }

                tag.NameTag = request.TagName;

                await _unitOfWork.TagRepository.UpdateAsync(tag);

                var response = new TagResponse
                {
                    TagId = tag.Id.ToString(),
                    TagName = tag.NameTag,
                };

                return Result<TagResponse>.Success(response);
            });
        }
    }
}
