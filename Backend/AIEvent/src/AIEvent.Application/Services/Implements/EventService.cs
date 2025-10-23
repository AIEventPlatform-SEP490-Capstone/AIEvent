using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Organizer;
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
            if (organizerId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var validationTicketDetailsResult = ValidationHelper.ValidateModelList(request.TicketDetails);
            if (!validationTicketDetailsResult.IsSuccess)
                return validationTicketDetailsResult;

            if (request.EndTime < request.StartTime)
                return ErrorResponse.FailureResult("EndTime cannot be before the StartTime", ErrorCodes.InvalidInput);

            if (request.SaleEndTime < request.SaleStartTime)
                return ErrorResponse.FailureResult("SaleEndTime cannot be before the SaleStartTime", ErrorCodes.InvalidInput);

            if (request.SaleEndTime > request.StartTime)
                return ErrorResponse.FailureResult("SaleEndTime cannot be after the event StartTime", ErrorCodes.InvalidInput);

            if (request.TicketDetails.Any(td => td.MaxPurchaseQuantity <  td.MinPurchaseQuantity))
                return ErrorResponse.FailureResult("MinPurchaseQuantity cannot be greater than MaxPurchaseQuantity", ErrorCodes.InvalidInput);

            var organizer = await _unitOfWork.OrganizerProfileRepository.GetByIdAsync(organizerId, true);
            if (organizer?.Status != ConfirmStatus.Approve)
                return ErrorResponse.FailureResult("Organizer not found or inactive", ErrorCodes.Unauthorized);

            var events = _mapper.Map<Event>(request);

            if (events == null)
                return ErrorResponse.FailureResult("Failed to map event", ErrorCodes.InternalServerError);

            if (request.ImgListEvent?.Any() == true)
            {
                var uploadTasks = request.ImgListEvent
                    .Select(img => _cloudinaryService.UploadImageAsync(img))
                    .ToList();

                var uploadResults = await Task.WhenAll(uploadTasks);
                var failedUploads = uploadResults.Where(r => r == null || string.IsNullOrEmpty(r)).ToList();
                if (failedUploads.Any())
                    return ErrorResponse.FailureResult("Some images failed to upload", ErrorCodes.InternalServerError);
                events.ImgListEvent = JsonSerializer.Serialize(uploadResults.Where(r => r != null));
            }

            events.OrganizerProfileId = organizerId;

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.EventRepository.AddAsync(events);
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
                                                .AsNoTracking()
                                                .Where(e => e.StartTime > DateTime.Now && !e.DeletedAt.HasValue && e.RequireApproval == ConfirmStatus.Approve);

            if (!string.IsNullOrEmpty(search))
                events = events
                                .Where(e => e.Title.ToLower().Contains(search.ToLower()));

            if (!string.IsNullOrEmpty(eventCategoryId))
                events = events
                                .Where(e => e.EventCategoryId == Guid.Parse(eventCategoryId));

            if (tags != null && tags.Count > 0)
            {
                var tagIds = tags.Select(t => t.TagId).ToList();
                events = events
                            .Where(e => e.EventTags.Any(et => tagIds.Contains(et.TagId)));
            }

            if (ticketType.HasValue)
                events = events
                                .Where(e => e.TicketType == ticketType);

            if (!string.IsNullOrEmpty(city))
                events = events
                                .Where(e => (e.City ?? string.Empty).ToLower().Contains(city.ToLower()));

            if (timeLine.HasValue)
            {
                var today = DateTime.Today;
                var diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
                var startOfWeek = today.AddDays(-diff);
                var endOfWeek = startOfWeek.AddDays(6);

                switch (timeLine.Value)
                {
                    case TimeLine.Today:
                        events = events.Where(e => e.StartTime.Date == today);
                        break;

                    case TimeLine.Tomorrow:
                        events = events.Where(e => e.StartTime.Date == today.AddDays(1));
                        break;

                    case TimeLine.ThisWeek:
                        events = events.Where(e => e.StartTime.Date >= today && e.StartTime.Date <= endOfWeek);
                        break;

                    case TimeLine.ThisMonth:
                        events = events.Where(e => e.StartTime.Month == today.Month && e.StartTime.Year == today.Year);
                        break;
                }
            }


            int totalCount = await events.CountAsync();

            var result = await events
                .OrderByDescending(e => e.CreatedAt)
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
                    Publish = e.Publish,
                    RequireApproval = e.RequireApproval,
                    Tags = e.EventTags.Select(t => new TagResponse
                    {
                        TagId = t.TagId.ToString(),
                        TagName = t.Tag.NameTag
                    }).ToList(),
                    TicketPrice = e.TicketDetails != null
                        ? e.TicketDetails.Min(t => t.TicketPrice)
                        : 0,
                    IsFavorite = userId.HasValue && userId != Guid.Empty && e.FavoriteEvents.Any(fe => fe.UserId == userId),
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(e.ImgListEvent, new JsonSerializerOptions()) ?? new List<string>()
                })
                .ToListAsync();

            return new BasePaginated<EventsResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> UpdateEventAsync(Guid organizerId, Guid eventId, UpdateEventRequest request)
        {

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {

                if (request.EndTime < request.StartTime)
                    return ErrorResponse.FailureResult("EndTime cannot be before the StartTime", ErrorCodes.InvalidInput);

                var organizer = await _unitOfWork.OrganizerProfileRepository.GetByIdAsync(organizerId, true);

                if (organizer?.Status != ConfirmStatus.Approve)
                    return ErrorResponse.FailureResult("Organizer not found or inactive", ErrorCodes.Unauthorized);

                var events = await _unitOfWork.EventRepository.GetByIdAsync(eventId, true);

                if (events == null)
                    return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

                if (events.OrganizerProfileId != organizerId)
                    return ErrorResponse.FailureResult("You are not authorized to update this event", ErrorCodes.Unauthorized);

                if (events == null)
                    return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.NotFound);

                _mapper.Map(request, events);

                var existingImages = string.IsNullOrEmpty(events.ImgListEvent)
                                        ? new List<string>()
                                        : JsonSerializer.Deserialize<List<string>>(events.ImgListEvent)!;

                if (request.RemoveImageUrls != null && request.RemoveImageUrls.Any())
                {
                    foreach (var imageUrl in request.RemoveImageUrls)
                    {
                        existingImages.Remove(imageUrl);
                        await _cloudinaryService.DeleteImageAsync(imageUrl);
                    }
                }

                if (request.ImgListEvent != null && request.ImgListEvent.Any())
                {
                    var uploadTasks = request.ImgListEvent
                        .Select(img => _cloudinaryService.UploadImageAsync(img)!)
                        .ToList();

                    var newImageUrls = await Task.WhenAll(uploadTasks);

                    existingImages.AddRange(newImageUrls!);
                }

                events.ImgListEvent = JsonSerializer.Serialize(existingImages);

                events.OrganizerProfileId = organizerId;
                await _unitOfWork.EventRepository.UpdateAsync(events);

                return Result.Success();
            });
        }

        public async Task<Result<EventDetailResponse>> GetEventByIdAsync(Guid eventId)
        {
            if (eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var events = await _unitOfWork.EventRepository
                .Query()
                .Where(e => e.Id == eventId)
                .ProjectTo<EventDetailResponse>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();

            if (events == null)
                return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            return Result<EventDetailResponse>.Success(events);
        }

        public async Task<Result> DeleteEventAsync(Guid eventId)
        {
            if (eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var existingEvent = await _unitOfWork.EventRepository.GetByIdAsync(eventId, true);
                if (existingEvent == null  || existingEvent.DeletedAt.HasValue)
                    return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.InvalidInput);

                await _unitOfWork.EventRepository.DeleteAsync(existingEvent!);
                return Result.Success();
            });
        }

        public async Task<Result<BasePaginated<EventsRelatedResponse>>> GetRelatedEventAsync(Guid eventId,
                                                                                             int pageNumber = 1,
                                                                                             int pageSize = 5)
        {
            if (eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.StartTime > DateTime.Now 
                                                        && !e.DeletedAt.HasValue 
                                                        && e.RequireApproval == ConfirmStatus.Approve
                                                        && e.Id != eventId);

            var eventDetail = await _unitOfWork.EventRepository
                                               .Query()
                                               .Include(e => e.EventTags)
                                               .FirstOrDefaultAsync(e => e.Id == eventId);
            IQueryable<Event> eventsQuery;

            if (eventDetail != null)
            {
                var relatedTagIds = eventDetail.EventTags?
                    .Select(t => t.TagId)
                    .ToList() ?? new List<Guid>();

                eventsQuery = events.Where(e =>
                    e.Id != eventId &&
                    (
                        e.EventCategoryId == eventDetail.EventCategoryId
                        || (relatedTagIds.Any() && e.EventTags.Any(t => relatedTagIds.Contains(t.TagId)))
                        || e.City == eventDetail.City
                    ));

                if (!await eventsQuery.AnyAsync())
                {
                    eventsQuery = events.Where(e => e.Id != eventId);
                }
            }
            else
            {
                eventsQuery = events;
            }

            int totalCount = await eventsQuery.CountAsync();

            var result = await eventsQuery
                .OrderBy(e => e.StartTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventsRelatedResponse
                {
                    EventId = e.Id,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
                    MinTicketPrice = e.TicketDetails.Any()
                        ? e.TicketDetails.Min(t => t.TicketPrice)
                        : 0,
                    MaxTicketPrice = e.TicketDetails.Any() 
                        ? e.TicketDetails.Max(t => t.TicketPrice)
                        : 0,
                    Description = e.Description,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(e.ImgListEvent, new JsonSerializerOptions())
                })
                .ToListAsync();

            return new BasePaginated<EventsRelatedResponse>(result, totalCount, pageNumber, pageSize);
        }


        public async Task<Result<BasePaginated<EventsRawResponse>>> GetAllEventDraftAsync(Guid organizerId, int pageNumber = 1, int pageSize = 10)
        {
            if(organizerId == Guid.Empty)
                return ErrorResponse.FailureResult("Not found organizer", ErrorCodes.Unauthorized);

            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.Publish == false && !e.IsDeleted && organizerId == e.OrganizerProfileId);

            int totalCount = await events.CountAsync();

            var result = await events
                .OrderBy(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventsRawResponse
                {
                    EventId = e.Id,
                    EventCategoryName = e.EventCategory.CategoryName,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
                    Description = e.Description,
                    TicketType = e.TicketType,
                    LocationName = e.LocationName,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(e.ImgListEvent, new JsonSerializerOptions())
                })
                .ToListAsync();

            return new BasePaginated<EventsRawResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<BasePaginated<EventsRawResponse>>> GetAllEventStatusAsync(Guid? organizerId, string? search, ConfirmStatus? status = null, int pageNumber = 1, int pageSize = 10)
        {

            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.Publish == true && !e.IsDeleted);

            if(organizerId != Guid.Empty)
                events = events.Where(e => e.OrganizerProfileId == organizerId);

            if (!string.IsNullOrEmpty(search))
                events = events.Where(e => e.Title.ToLower().Contains(search.ToLower()) ||
                                          (e.Address != null && e.Address.ToLower().Contains(search.ToLower())) ||
                                          e.Description.ToLower().Contains(search.ToLower()));
            if (status == ConfirmStatus.Approve)
                events = events.Where(e => e.RequireApproval == ConfirmStatus.Approve);
            else if (status == ConfirmStatus.Reject)
                events = events.Where(e => e.RequireApproval == ConfirmStatus.Reject);
            else if (status == ConfirmStatus.NeedConfirm)
                events = events.Where(e => e.RequireApproval == ConfirmStatus.NeedConfirm);

            int totalCount = await events.CountAsync();

            var result = await events
                .OrderBy(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventsRawResponse
                {
                    EventId = e.Id,
                    EventCategoryName = e.EventCategory.CategoryName,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
                    Description = e.Description,
                    TicketType = e.TicketType,
                    LocationName = e.LocationName,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(e.ImgListEvent, new JsonSerializerOptions())
                })
                .ToListAsync();

            return new BasePaginated<EventsRawResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> ConfirmEventAsync(Guid userId, Guid eventId, ConfirmRequest request)
        {
            if (userId == Guid.Empty || eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            if (request == null)
                return ErrorResponse.FailureResult("Request cannot be null", ErrorCodes.InvalidInput);

            var entity = await _unitOfWork.EventRepository
                .Query()
                .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

            if(entity == null)
                return ErrorResponse.FailureResult("Event can not found or is deleted", ErrorCodes.NotFound);

            if (entity.RequireApproval != ConfirmStatus.NeedConfirm)
                return ErrorResponse.FailureResult("Event has already been processed", ErrorCodes.InvalidInput);

            if (request.Status == ConfirmStatus.Reject)
            {
                if (string.IsNullOrWhiteSpace(request.Reason))
                    return ErrorResponse.FailureResult("Reason is required when rejecting", ErrorCodes.InvalidInput);

                entity.ReasonReject = request.Reason.Trim();
            }

            entity.RequireApproval = request.Status;
            entity.RequireApprovalAt = DateTime.UtcNow;
            entity.RequireApprovalBy = userId;
            await _unitOfWork.EventRepository.UpdateAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }
    }
}
