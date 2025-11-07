using AIEvent.Application.DTOs.Rating;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IRatingService
    {
        Task<Result> CreateRatingAsync(Guid userId, Guid eventId, RatingRequest request);
        Task<Result> UpdateRatingAsync(Guid userId, Guid ratingId, RatingRequest request);
        Task<Result> DeleteRatingAsync(Guid userId, Guid ratingId);
        Task<Result<BasePaginated<RatingResponse>>> GetRatingByEventId(Guid? userId, Guid eventId, int pageNumber = 1, int pageSize = 5);
    }
}
