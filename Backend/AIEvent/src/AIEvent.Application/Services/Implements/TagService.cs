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
    }
}
