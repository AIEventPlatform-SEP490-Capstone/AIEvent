using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Rating;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class RatingService : IRatingService
    {
        private readonly IUnitOfWork _unitOfWork;
        public RatingService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result> CreateRatingAsync(Guid userId, Guid eventId, RatingRequest request)
        {
            var hasAttended = await _unitOfWork.BookingRepository
                                            .Query()
                                            .AnyAsync(b => b.UserId == userId 
                                                    && b.EventId == eventId
                                                    && b.Status == BookingStatus.Completed);

            if (!hasAttended)
                return ErrorResponse.FailureResult("You have not participated in this event.", ErrorCodes.InvalidInput);

            var exists = await _unitOfWork.RatingRepository
                                        .Query()
                                        .AnyAsync(r => r.EventId == eventId
                                                    && r.UserId == userId);
            if (exists)
                return ErrorResponse.FailureResult("You have already rated this event.", ErrorCodes.InvalidInput);

            if (!string.IsNullOrWhiteSpace(request.Comment))
            {
                //var isSafe = await _aiModerationService.IsCommentSafeAsync(dto.Comment);
                //if (!isSafe)
                //    return ErrorResponse.FailureResult("Comment content is inappropriate and not allowed to be posted.", ErrorCodes.InvalidInput);
            }

            var rating = new Rating
            {
                EventId = eventId,
                UserId = userId,
                RatingScore = request.RatingScore,
                Comment = request.Comment
            };

            await _unitOfWork.RatingRepository.AddAsync(rating);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result> DeleteRatingAsync(Guid userId, Guid ratingId)
        {
            var rating = await _unitOfWork.RatingRepository.GetByIdAsync(ratingId, true);
            if (rating == null || rating.UserId != userId)
                return ErrorResponse.FailureResult("Not found or you do not have permission.", ErrorCodes.Unauthorized);
            _unitOfWork.DisableSoftDelete();
            await _unitOfWork.RatingRepository.DeleteAsync(rating);
            await _unitOfWork.SaveChangesAsync();
            _unitOfWork.EnableSoftDelete();
            return Result.Success();
        }

        public async Task<Result<BasePaginated<RatingResponse>>> GetRatingByEventId(Guid? userId, Guid eventId, int pageNumber = 1, int pageSize = 5)
        {
            if (eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            IQueryable<Rating> ratings = _unitOfWork.RatingRepository
                                                .Query()
                                                .Where(r => !r.IsDeleted 
                                                        && r.EventId == eventId);

            int totalCount = await ratings.CountAsync();
            var orderedQuery = ratings
                                .OrderBy(r => r.UserId == userId ? 0 : 1) 
                                .ThenByDescending(r => r.CreatedAt);
            var result = await ratings
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new RatingResponse
                {
                    UserName = r.User.FullName ?? r.User.Email,
                    Comment = r.Comment,
                    CreateAt = r.CreatedAt,
                    RatingScore = r.RatingScore
                })
                .ToListAsync();
            await RecalculateEventStatsAsync(eventId);
            return new BasePaginated<RatingResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> UpdateRatingAsync(Guid userId, Guid ratingId, RatingRequest request)
        {
            var rating = await _unitOfWork.RatingRepository.GetByIdAsync(ratingId, true);
            if (rating == null || rating.UserId != userId)
                return ErrorResponse.FailureResult("Not found or you do not have permission.", ErrorCodes.Unauthorized);

            if (!string.IsNullOrWhiteSpace(request.Comment))
            {
                //var isSafe = await _aiModerationService.IsCommentSafeAsync(dto.Comment);
                //if (!isSafe)
                //    return ErrorResponse.FailureResult("Inappropriate comment content.", ErrorCodes.InvalidInput);
            }

            rating.RatingScore = request.RatingScore;
            rating.Comment = request.Comment;
            await _unitOfWork.RatingRepository.UpdateAsync(rating);
            await _unitOfWork.SaveChangesAsync();
            return Result.Success();
        }

        private async Task RecalculateEventStatsAsync(Guid eventId)
        {
            var stats = await _unitOfWork.RatingRepository.Query()
                .Where(r => r.EventId == eventId && !r.IsDeleted && r.RatingScore > 0)
                .GroupBy(r => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Average = g.Average(r => (double?)r.RatingScore) ?? 0
                })
                .FirstOrDefaultAsync();

            var eventEntity = await _unitOfWork.EventRepository.GetByIdAsync(eventId, true);
            if (eventEntity == null)
                return;

            eventEntity.TotalRatings = stats?.Total ?? 0;
            eventEntity.AverageRating = Math.Round(stats?.Average ?? 0, 1);

            await _unitOfWork.EventRepository.UpdateAsync(eventEntity);
            await _unitOfWork.SaveChangesAsync();
        }

    }
}
