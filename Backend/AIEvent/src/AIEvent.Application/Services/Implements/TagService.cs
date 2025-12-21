using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AIEvent.Application.Services.Implements
{
    public class TagService : ITagService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IContentModerationService _contentModerationService;
        public TagService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IContentModerationService contentModerationService)
        {
            _transactionHelper = transactionHelper;
            _unitOfWork = unitOfWork;
            _contentModerationService = contentModerationService;
        }

        public async Task<Result> CreateTagAsync(CreateTagRequest request, string role)
        {
            if (!string.IsNullOrWhiteSpace(request.NameTag))
            {
                var isSafe = await _contentModerationService.ProfanityChecker(JsonSerializer.Serialize(request));
                if (!isSafe.IsSuccess)
                    return ErrorResponse.FailureResult(isSafe.Error!.Message, isSafe.Error.StatusCode);
            }

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var existingTag = await _unitOfWork.TagRepository
                                            .Query()
                                            .AsNoTracking()
                                            .FirstOrDefaultAsync(t => t.NameTag.ToLower() == request.NameTag.ToLower() && !t.IsDeleted);
                if (existingTag != null)
                {
                    return ErrorResponse.FailureResult("Tag is already existing", ErrorCodes.InvalidInput);
                }

                Tag tag = new()
                {
                    NameTag = request.NameTag,
                };

                if (role == "Manager" || role == "Admin")
                {
                    tag.CreatedBy = "System";
                }
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
                    CreatedDate = p.CreatedAt,
                    UpdatedDate = p.UpdatedAt,
                    QuantityUsed = _unitOfWork.EventTagRepository.Query(false)
                        .Count(et =>
                            et.TagId == p.Id &&
                            !et.Event.DeletedAt.HasValue &&
                            et.Event.Status != EventStatus.Cancelled)
                })
                .ToListAsync();

            return new BasePaginated<TagResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<BasePaginated<TagResponse>>> GetListTagByUserIdAsync(int pageNumber, int pageSize, Guid userId)
        {
            var Id = userId.ToString();
            var managerUserIds = _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .Where(u => u.Role.Name == "Manager")
                .Select(u => u.Id.ToString());

            IQueryable<Tag> tagQuery = _unitOfWork.TagRepository
                .Query()
                .AsNoTracking()
                .Where(p => !p.DeletedAt.HasValue && (p.CreatedBy == Id || managerUserIds.Contains(p.CreatedBy)))
                .OrderByDescending(s => s.CreatedAt);

            int totalCount = await tagQuery.CountAsync();

            var result = await tagQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new TagResponse
                {
                    TagId = p.Id.ToString(),
                    TagName = p.NameTag,
                    CreatedDate = p.CreatedAt,
                    UpdatedDate = p.UpdatedAt,
                    QuantityUsed = _unitOfWork.EventTagRepository.Query(false)
                        .Count(et =>
                            et.TagId == p.Id &&
                            !et.Event.DeletedAt.HasValue &&
                            et.Event.Status != EventStatus.Cancelled)
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
            if (!string.IsNullOrWhiteSpace(request.TagName))
            {
                var isSafe = await _contentModerationService.ProfanityChecker(JsonSerializer.Serialize(request));
                if (!isSafe.IsSuccess)
                    return ErrorResponse.FailureResult(isSafe.Error!.Message, isSafe.Error.StatusCode);
            }

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


        public async Task<Result<BasePaginated<TagResponse>>> GetListPopularTagAsync(int pageNumber, int pageSize)
        {
            var tagUsageQuery =
                from et in _unitOfWork.EventTagRepository.Query(false)
                where !et.Event.DeletedAt.HasValue
                      && et.Event.Status == EventStatus.Approved
                      && et.Event.Publish == true
                group et by et.TagId
                into g
                //where g.Count() > 5
                select new
                {
                    TagId = g.Key,
                    QuantityUsed = g.Count()
                };

            var query =
                from t in _unitOfWork.TagRepository.Query().AsNoTracking()
                join tu in tagUsageQuery on t.Id equals tu.TagId
                where !t.DeletedAt.HasValue
				orderby tu.QuantityUsed descending
				select new TagResponse
                {
                    TagId = t.Id.ToString(),
                    TagName = t.NameTag,
                    CreatedDate = t.CreatedAt,
                    UpdatedDate = t.UpdatedAt,
                    QuantityUsed = tu.QuantityUsed
                };
			query = query.Take(20);
			var totalCount = await query.CountAsync();

            var result = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new BasePaginated<TagResponse>(
                result,
                totalCount,
                pageNumber,
                pageSize
            );
        }

    }
}
