using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Domain.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AIEvent.Application.Services.Implements
{
    public class EventService : IEventService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IMapper _mapper;
        private readonly ICloudinaryService _cloudinaryService;
        public EventService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IMapper mapper, ICloudinaryService cloudinaryService)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _mapper = mapper;
            _cloudinaryService = cloudinaryService;
        }
        public async Task<Result> CreateEventAsync(Guid organizerId, CreateEventRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {

                if (request.EndTime < request.StartTime)
                {
                    return ErrorResponse.FailureResult("EndTime cannot be before the StartTime", ErrorCodes.InvalidInput);
                }

                var organizer = await _unitOfWork.OrganizerProfileRepository.GetByIdAsync(organizerId, true);
                if (organizer?.Status != OrganizerStatus.Approve)
                {
                    return ErrorResponse.FailureResult("Organizer not found or inactive", ErrorCodes.Unauthorized);
                }


                var events = _mapper.Map<Event>(request);

                if (events == null)
                {
                    return ErrorResponse.FailureResult("Failed to map event", ErrorCodes.InternalServerError);
                }

                var uploadTasks = new List<Task<string>>();
                if (request.ImgListEvent != null)
                {
                    foreach (var img in request.ImgListEvent)
                    {
                        uploadTasks.Add(_cloudinaryService.UploadImageAsync(img)!);
                    }
                    var results = await Task.WhenAll(uploadTasks);
                    events.ImgListEvent = JsonSerializer.Serialize(results);
                }
                events.OrganizerProfileId = organizerId;
                await _unitOfWork.EventRepository.AddAsync(events);

                if(request.Publish == true)
                {
                    //Request đến Manager để duyệt event
                }

                return Result.Success();
            });
        }

        public async Task<Result<BasePaginated<EventsResponse>>> GetEventAsync(Guid? userId,
                                                                                string? search, 
                                                                                string? eventCategoryId, 
                                                                                List<EventTagRequest> tags, 
                                                                                TicketType? ticketType, 
                                                                                string? city, 
                                                                                TimeLine? timeLine, 
                                                                                int pageNumber = 1, 
                                                                                int pageSize = 5)
        {
            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .Include(e => e.EventCategory)
                                                .Include(e => e.FavoriteEvents)
                                                .Include(e => e.EventTags)
                                                    .ThenInclude(e => e.Tag)
                                                .AsNoTracking()
                                                .Where(e => e.StartTime > DateTime.Now && !e.DeletedAt.HasValue && e.RequireApproval == true);

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

            if (tags != null || tags!.Count > 0)
            {
                var tagIds = tags.Select(t => t.TagId).ToList();
                events = events
                            .Where(e => e.EventTags.Any(et => tagIds.Contains(et.TagId)));
            }

            if (ticketType.HasValue)
            {
                events = events
                            .Where(e => e.TicketType == ticketType);
            }

            if (!string.IsNullOrEmpty(city))
            {
                events = events
                            .Where(e => (e.City ?? string.Empty).ToLower().Contains(city.ToLower()));
            }

            if (timeLine.HasValue)
            {
                var today = DateTime.Today;

                switch (timeLine.Value)
                {
                    case TimeLine.Today:
                        events = events.Where(e => e.StartTime.Date == today);
                        break;

                    case TimeLine.Tomorrow:
                        events = events.Where(e => e.StartTime.Date == today.AddDays(1));
                        break;

                    case TimeLine.ThisWeek:
                        var startOfWeek = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
                        var endOfWeek = startOfWeek.AddDays(6);
                        events = events.Where(e => e.StartTime.Date >= startOfWeek && e.StartTime.Date <= endOfWeek);
                        break;

                    case TimeLine.ThisMonth:
                        events = events.Where(e => e.StartTime.Month == today.Month && e.StartTime.Year == today.Year);
                        break;
                }
            }

            int totalCount = await events.CountAsync();

            var result = await events
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
                    IsFavorite = userId != null && e.FavoriteEvents.Any(fe => fe.UserId == userId),
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(e.ImgListEvent, new JsonSerializerOptions())
                })
                .ToListAsync();

            return new BasePaginated<EventsResponse>(result, totalCount, pageNumber, pageSize);
        }


        public async Task<Result<EventDetailResponse>> GetEventByIdAsync(string eventId)
        {
            var events = await _unitOfWork.EventRepository
                .Query()
                .Include(o => o.OrganizerProfile)
                .Include(o => o.TicketDetails)
                .Include(o => o.EventCategory)
                .Include(o => o.EventTags)
                    .ThenInclude(et => et.Tag)
                .ProjectTo<EventDetailResponse>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync(e => e.EventId == Guid.Parse(eventId));

            if (events == null)
                return ErrorResponse.FailureResult("Event code already exists.", ErrorCodes.InvalidInput);

            return Result<EventDetailResponse>.Success(events);
        }

        public async Task<Result> DeleteEventAsync(string eventId)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var existingEvent = await _unitOfWork.EventRepository.GetByIdAsync(Guid.Parse(eventId), true);
                if (existingEvent == null  || existingEvent.DeletedAt.HasValue)
                    return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.InvalidInput);

                await _unitOfWork.EventRepository.DeleteAsync(existingEvent!);
                return Result.Success();
            });
        }
    }
}
