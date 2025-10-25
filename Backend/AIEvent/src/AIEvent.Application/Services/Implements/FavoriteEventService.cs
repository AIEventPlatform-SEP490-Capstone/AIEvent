using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
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
    public class FavoriteEventService : IFavoriteEventService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;
        public FavoriteEventService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
        }
        public async Task<Result> AddFavoriteEvent(Guid userId, Guid eventId)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var user = await _unitOfWork.UserRepository
                                            .Query()
                                            .FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null || user.IsActive == false)
                {
                    return ErrorResponse.FailureResult("User not found or inactive", ErrorCodes.Unauthorized);
                }
                var eventDetail = await _unitOfWork.EventRepository.GetByIdAsync(eventId, true);
                if (eventDetail == null || eventDetail.RequireApproval == ConfirmStatus.Reject)
                {
                    return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.NotFound);
                }

                var fevent = new FavoriteEvent
                {
                    UserId = userId,
                    EventId = eventId,
                    CreatedAt = DateTime.UtcNow,
                };

                await _unitOfWork.FavoriteEventRepository.AddAsync(fevent);
                return Result.Success();
            });
        }

        public async Task<Result<BasePaginated<EventsResponse>>> GetFavoriteEvent(Guid userId,
                                                                                string? search, 
                                                                                string? eventCategoryId,
                                                                                int pageNumber = 1,
                                                                                int pageSize = 5)
        {
            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.FavoriteEvents.Any(x => x.UserId == userId) &&
                                                       !e.DeletedAt.HasValue && 
                                                       e.RequireApproval == ConfirmStatus.Approve);

            if (!string.IsNullOrEmpty(search))
            {
                events = events
                            .Where(e => e.Title.ToLower().Contains(search.ToLower()));
            }

            if (!string.IsNullOrEmpty(eventCategoryId))
            {
                events = events
                            .Where(e => e.EventCategoryId == Guid.Parse(eventCategoryId));
            }

            int totalCount = await events.CountAsync();

            var result = await events
                .OrderBy(u => u.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventsResponse
                {
                    EventId = e.Id,
                    EventCategoryName = e.EventCategory.CategoryName,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
                    Description = e.Description,
                    TicketType = e.TicketType,
                    TotalTickets = e.TotalTickets,
                    SoldQuantity = e.SoldQuantity,
                    LocationName = e.LocationName,
                    Tags = e.EventTags.Select(t => new TagResponse
                    {
                        TagId = t.TagId.ToString(),
                        TagName = t.Tag.NameTag
                    }).ToList(),
                    IsFavorite = true,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(e.ImgListEvent, new JsonSerializerOptions())
                })
                .ToListAsync();

            return new BasePaginated<EventsResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> RemoveFavoriteEvent(Guid userId, Guid eventId)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var favorite = await _unitOfWork.FavoriteEventRepository
                                                .Query()
                                                .FirstOrDefaultAsync(fe => fe.UserId == userId && fe.EventId == eventId);

                if (favorite == null)
                {
                    return ErrorResponse.FailureResult("Favorite event not found", ErrorCodes.NotFound);
                }

                await _unitOfWork.FavoriteEventRepository.DeleteAsync(favorite);
                return Result.Success();
            });
        }
    }
}
