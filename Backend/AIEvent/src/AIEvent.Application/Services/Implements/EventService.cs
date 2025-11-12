using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Notification; 
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class EventService : IEventService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IMapper _mapper;
        private readonly IHangfireJobService _hangfireJobService;
        private readonly INotificationService _notificationService;
        public EventService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IMapper mapper, IHangfireJobService hangfireJobService, INotificationService notificationService)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _mapper = mapper;
            _hangfireJobService = hangfireJobService;
            _notificationService = notificationService;
        }

        public async Task<Result> CreateEventAsync(Guid organizerId, CreateEventRequest request)
        {
            if (organizerId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid OrganizerId", ErrorCodes.InvalidInput);

            var validationResult = ValidationHelper.ValidateModel(request);
            if (!validationResult.IsSuccess)
                return validationResult;

            var validationTicketDetailsResult = ValidationHelper.ValidateModelList(request.TicketTypes);
            if (!validationTicketDetailsResult.IsSuccess)
                return validationTicketDetailsResult;

            if (request.EndTime < request.StartTime)
                return ErrorResponse.FailureResult("EndTime cannot be before the StartTime", ErrorCodes.InvalidInput);

            if (request.SaleEndTime < request.SaleStartTime)
                return ErrorResponse.FailureResult("SaleEndTime cannot be before the SaleStartTime", ErrorCodes.InvalidInput);

            if (request.SaleEndTime > request.StartTime)
                return ErrorResponse.FailureResult("SaleEndTime cannot be after the event StartTime", ErrorCodes.InvalidInput);
             
            if (request.Publish == true)
            {
                if (request.ImgListEvidences == null || !request.ImgListEvidences.Any())
                    return ErrorResponse.FailureResult("Evidence images are required when publishing the event", ErrorCodes.InvalidInput);
                request.Status = EventStatus.PendingApproval;
            }

            var organizer = await _unitOfWork.OrganizerProfileRepository.GetByIdAsync(organizerId, true);
            if (organizer?.Status != OrganizerProfileStatus.Approved)
                return ErrorResponse.FailureResult("Organizer not found or inactive", ErrorCodes.Unauthorized);

            var events = _mapper.Map<Event>(request);
            if (events == null)
                return ErrorResponse.FailureResult("Failed to map event", ErrorCodes.InternalServerError);
            
            events.OrganizerProfileId = organizerId;

            var result = await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                await _unitOfWork.EventRepository.AddAsync(events);
                return Result.Success();
            });

            if (result.IsSuccess && request.Publish == true)
            {
                var managerRole = await _unitOfWork.RoleRepository
                    .Query()
                    .FirstOrDefaultAsync(r => r.Name == "Manager" && !r.IsDeleted);

                if (managerRole != null)
                {
                    var firstImage = request.ImgListEvent != null && request.ImgListEvent.Any()
                        ? request.ImgListEvent.First()
                        : null;

                    var notificationRequest = new CreateNotificationToAllRequest
                    {
                        Title = "Yêu cầu phê duyệt sự kiện",
                        Message = $"Có một sự kiện mới <strong>{request.Title}</strong> cần được phê duyệt.",
                        Type = NotificationType.EventCreated,
                        Channel = NotificationChannel.InApp,
                        TargetRoles = new List<Guid> { managerRole.Id },
                        EventId = events.Id,
                        ImageUrl = firstImage
                    };

                    await _notificationService.CreateNotificationToAllAsync(notificationRequest);
                }
            }

            return result;
        }

        public async Task<Result<BasePaginated<EventsResponse>>> GetEventAsync(Guid? userId,
                                                                                string? search, 
                                                                                string? eventCategoryId, 
                                                                                List<EventTagRequest> tags, 
                                                                                TicketPricingType? ticketType, 
                                                                                string? district, 
                                                                                TimeLine? timeLine, 
                                                                                int pageNumber = 1, 
                                                                                int pageSize = 5)
        {
            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.EndTime.AddDays(7) > DateTime.UtcNow 
                                                    && !e.DeletedAt.HasValue 
                                                    && e.Status == EventStatus.Approved 
                                                    && e.Publish == true);

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
                                .Where(e => e.TicketPricingType == ticketType);

            if (!string.IsNullOrEmpty(district))
                events = events
                                .Where(e => (e.District ?? string.Empty).ToLower().Contains(district.ToLower()));

            if (timeLine.HasValue)
            {
                var now = DateTime.UtcNow;
                var today = now.Date;
                var tomorrow = today.AddDays(1);
                var endOfToday = today.AddDays(1).AddTicks(-1); 
                var endOfTomorrow = tomorrow.AddDays(1).AddTicks(-1);

                switch (timeLine.Value)
                {
                    case TimeLine.Today:
                        events = events.Where(e => e.StartTime >= now && e.StartTime <= endOfToday);
                        break;

                    case TimeLine.Tomorrow:
                        events = events.Where(e => e.StartTime >= tomorrow && e.StartTime <= endOfTomorrow);
                        break;

                    case TimeLine.ThisWeek:
                        var diff = (7 + (today.DayOfWeek - DayOfWeek.Monday)) % 7;
                        var startOfWeek = today.AddDays(-diff);
                        var endOfWeek = startOfWeek.AddDays(7).AddTicks(-1); 
                        events = events.Where(e => e.StartTime >= now && e.StartTime <= endOfWeek);
                        break;

                    case TimeLine.ThisMonth:
                        var endOfMonth = new DateTime(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month))
                                        .AddDays(1).AddTicks(-1);
                        events = events.Where(e => e.StartTime >= now && e.StartTime <= endOfMonth);
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
                    TicketPricingType = e.TicketPricingType,
                    TotalTickets = e.TotalTickets,
                    SoldQuantity = e.SoldQuantity,
                    LocationName = e.LocationName,
                    Publish = e.Publish,
                    AverageRating = e.AverageRating,
                    TotalRatings = e.TotalRatings,
                    Status = e.Status,
                    Tags = e.EventTags.Select(t => new TagResponse
                    {
                        TagId = t.TagId.ToString(),
                        TagName = t.Tag.NameTag
                    }).ToList(),
                    TicketPrice = e.TicketTypes != null
                        ? e.TicketTypes.Min(t => t.TicketPrice)
                        : 0,
                    IsFavorite = userId.HasValue && userId != Guid.Empty && e.FavoriteEvents.Any(fe => fe.UserId == userId),
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return new BasePaginated<EventsResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> UpdateEventAsync(Guid organizerId, Guid eventId, UpdateEventRequest request)
        {
            if (organizerId == Guid.Empty || eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var eventQuery = await _unitOfWork.EventRepository
                .Query()
                .Include(e => e.TicketTypes)
                .Include(e => e.EventTags)
                .Where(e => e.Id == eventId && !e.IsDeleted)
                .FirstOrDefaultAsync();

            if (eventQuery == null)
                return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            if (eventQuery.OrganizerProfileId != organizerId)
                return ErrorResponse.FailureResult("You don't have permission to update this event", ErrorCodes.Unauthorized);

            if (eventQuery.Publish == true)
            {
                var hasActiveBookings = await _unitOfWork.EventRepository
                    .Query()
                    .Where(e => e.Id == eventId)
                    .SelectMany(e => e.Bookings)
                    .AnyAsync(b => b.Status == BookingStatus.Completed);

                if (hasActiveBookings)
                {
                    return ErrorResponse.FailureResult(
                        "Cannot update published event that has existing bookings",
                        ErrorCodes.InvalidInput
                    );
                }
            }

            if (request.Publish == true)
            {
                var validationResult = ValidateEventForPublish(request, eventQuery);
                if (!validationResult.IsSuccess)
                    return validationResult;
            }

            var result = await _transactionHelper.ExecuteInTransactionAsync(async () =>
            { 
                var originalSoldQuantity = eventQuery.SoldQuantity;

                _mapper.Map(request, eventQuery);
                
                if (eventQuery.SoldQuantity == 0 && originalSoldQuantity > 0)
                    eventQuery.SoldQuantity = originalSoldQuantity;

                var updateImagesResult = await UpdateEventImagesAsync(eventQuery, request);
                if (!updateImagesResult.IsSuccess)
                    return updateImagesResult;
                
                var updateEvidenceResult = await UpdateEventEvidenceAsync(eventQuery, request);
                if (!updateEvidenceResult.IsSuccess)
                    return updateEvidenceResult;

                var handleTicketsResult = await HandleTicketDetailsOperationsAsync(eventQuery, eventId, organizerId, request);
                if (!handleTicketsResult.IsSuccess)
                    return handleTicketsResult;
                 
                if (request.TicketTypes != null && request.TicketTypes.Any() || 
                    request.RemoveTicketTypeIds != null && request.RemoveTicketTypeIds.Any())
                {
                    eventQuery.TotalTickets = eventQuery.TicketTypes.Sum(t => t.TicketQuantity);
                    eventQuery.RemainingTickets = eventQuery.TotalTickets - eventQuery.SoldQuantity;
                }
                else if (request.TotalTickets.HasValue)
                {
                    eventQuery.TotalTickets = request.TotalTickets.Value;
                    eventQuery.RemainingTickets = eventQuery.TotalTickets - eventQuery.SoldQuantity;
                }
                else
                    eventQuery.RemainingTickets = eventQuery.TotalTickets - eventQuery.SoldQuantity;

                var handleTagsResult = HandleEventTagsOperations(eventQuery, eventId, request);
                if (!handleTagsResult.IsSuccess)
                    return handleTagsResult;

                if (request.Publish == true)
                    eventQuery.Status = EventStatus.PendingApproval;

                await _unitOfWork.EventRepository.UpdateAsync(eventQuery);

                return Result.Success();
            });

            if (result.IsSuccess && request.Publish == true)
            {
                var managerRole = await _unitOfWork.RoleRepository
                    .Query()
                    .FirstOrDefaultAsync(r => r.Name == "Manager" && !r.IsDeleted);

                if (managerRole != null)
                {
                    var eventTitle = request.Title ?? eventQuery.Title;
                    var firstImage = request.ImgListEvent != null && request.ImgListEvent.Any()
                        ? request.ImgListEvent.First()
                        : (!string.IsNullOrEmpty(eventQuery.ImgListEvent)
                            ? eventQuery.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                            : null);

                    var notificationRequest = new CreateNotificationToAllRequest
                    {
                        Title = "Yêu cầu phê duyệt sự kiện",
                        Message = $"Có một sự kiện mới <strong>{eventTitle}</strong> cần được phê duyệt.",
                        Type = NotificationType.EventCreated,
                        Channel = NotificationChannel.InApp,
                        TargetRoles = new List<Guid> { managerRole.Id },
                        EventId = eventId,
                        ImageUrl = firstImage
                    };

                    await _notificationService.CreateNotificationToAllAsync(notificationRequest);
                }
            }

            return result;
        }

        private Task<Result> UpdateEventImagesAsync(Event events, UpdateEventRequest request)
        {
            if ((request.RemoveImageUrls == null || !request.RemoveImageUrls.Any()) 
                && (request.ImgListEvent == null || !request.ImgListEvent.Any()))
                return Task.FromResult(Result.Success());

            var existingImages = string.IsNullOrEmpty(events.ImgListEvent)
                                    ? new List<string>()
                                    : events.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList();

            if (request.RemoveImageUrls != null && request.RemoveImageUrls.Any())
            {
                var imagesToRemove = request.RemoveImageUrls.Where(url => existingImages.Contains(url)).ToList();
                var remainingImagesCount = existingImages.Count - imagesToRemove.Count;
                var willAddNewImages = request.ImgListEvent != null && request.ImgListEvent.Any();
                
                if (remainingImagesCount <= 0 && !willAddNewImages)
                    return Task.FromResult(Result.Failure(ErrorResponse.FailureResult(
                            "Cannot remove all images. Event must have at least 1 image.",
                            ErrorCodes.InvalidInput
                        )));

                existingImages = existingImages.Where(img => !request.RemoveImageUrls.Contains(img)).ToList();
            }

            if (request.ImgListEvent != null && request.ImgListEvent.Any())
            {
                var newImageUrls = request.ImgListEvent
                    .Where(url => !string.IsNullOrWhiteSpace(url) && !existingImages.Contains(url))
                    .ToList();
                
                existingImages.AddRange(newImageUrls);
            }

            events.ImgListEvent = existingImages.Any() ? string.Join(", ", existingImages) : null;
            return Task.FromResult(Result.Success());
        }

        private Task<Result> UpdateEventEvidenceAsync(Event events, UpdateEventRequest request)
        {
            if ((request.RemoveImageEvidenceUrls == null || !request.RemoveImageEvidenceUrls.Any()) 
                && (request.ImgListEvidences == null || !request.ImgListEvidences.Any()))
                return Task.FromResult(Result.Success());

            var existingEvidence = string.IsNullOrEmpty(events.ImgListEvidences)
                ? new List<string>()
                : events.ImgListEvidences.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList();

            if (request.RemoveImageEvidenceUrls != null && request.RemoveImageEvidenceUrls.Any())
            {
                var evidenceToRemove = request.RemoveImageEvidenceUrls.Where(url => existingEvidence.Contains(url)).ToList();
                var remainingEvidenceCount = existingEvidence.Count - evidenceToRemove.Count;
                var willAddNewEvidence = request.ImgListEvidences != null && request.ImgListEvidences.Any();
                
                if (remainingEvidenceCount <= 0 && !willAddNewEvidence)
                    return Task.FromResult(Result.Failure(ErrorResponse.FailureResult(
                            "Cannot remove all evidence images. At least one evidence is required when publishing.",
                            ErrorCodes.InvalidInput
                        )));

                existingEvidence = existingEvidence.Where(ev => !request.RemoveImageEvidenceUrls.Contains(ev)).ToList();
            }

            if (request.ImgListEvidences != null && request.ImgListEvidences.Any())
            {
                var newEvidenceUrls = request.ImgListEvidences
                    .Where(url => !string.IsNullOrWhiteSpace(url) && !existingEvidence.Contains(url))
                    .ToList();
                
                existingEvidence.AddRange(newEvidenceUrls);
            }

            events.ImgListEvidences = existingEvidence.Any() ? string.Join(", ", existingEvidence) : null;
            return Task.FromResult(Result.Success());
        }

        private async Task<Result> HandleTicketDetailsOperationsAsync(Event events, Guid eventId, Guid organizerId, UpdateEventRequest request)
        { 
            if (request.RemoveTicketTypeIds != null && request.RemoveTicketTypeIds.Any())
            {
                var remainingTicketsCount = events.TicketTypes.Count - request.RemoveTicketTypeIds.Count;
                var willAddNewTickets = request.TicketTypes != null && 
                                       request.TicketTypes.Any(td => !td.Id.HasValue || td.Id.Value == Guid.Empty);
                
                if (remainingTicketsCount <= 0 && !willAddNewTickets)
                    return ErrorResponse.FailureResult(
                            "Cannot remove all ticket details. Event must have at least 1 ticket type.",
                            ErrorCodes.InvalidInput
                        );

                var ticketsToRemove = events.TicketTypes
                    .Where(td => request.RemoveTicketTypeIds.Contains(td.Id))
                    .ToList();

                foreach (var ticket in ticketsToRemove)
                { 
                    var hasSoldTickets = await _unitOfWork.EventRepository
                        .Query()
                        .Where(e => e.Id == eventId)
                        .SelectMany(e => e.TicketTypes)
                        .Where(td => td.Id == ticket.Id)
                        .AnyAsync(td => td.SoldQuantity > 0);

                    if (hasSoldTickets)
                        return ErrorResponse.FailureResult(
                                $"Cannot remove ticket '{ticket.TicketName}' because it has already been sold",
                                ErrorCodes.InvalidInput
                            );

                    events.TicketTypes.Remove(ticket);
                }
            } 
            if (request.TicketTypes != null && request.TicketTypes.Any())
            {
                foreach (var ticketRequest in request.TicketTypes)
                {
                    if (ticketRequest.Id.HasValue && ticketRequest.Id.Value != Guid.Empty)
                    { 
                        var existingTicket = events.TicketTypes.FirstOrDefault(td => td.Id == ticketRequest.Id.Value);
                        
                        if (existingTicket != null)
                        {
                            if (existingTicket.SoldQuantity > 0 && ticketRequest.TicketQuantity < existingTicket.SoldQuantity)
                                return ErrorResponse.FailureResult(
                                        $"Cannot reduce quantity below sold quantity ({existingTicket.SoldQuantity}) for ticket '{existingTicket.TicketName}'",
                                        ErrorCodes.InvalidInput
                                    );
                            _mapper.Map(ticketRequest, existingTicket);
                            existingTicket.RemainingQuantity = existingTicket.TicketQuantity - existingTicket.SoldQuantity;
                            existingTicket.SetUpdated(organizerId.ToString());
                        }
                    }
                    else
                    {
                        var newTicket = _mapper.Map<TicketType>(ticketRequest);
                        newTicket.Id = Guid.NewGuid();
                        newTicket.EventId = eventId;
                        newTicket.SoldQuantity = 0;
                        newTicket.RemainingQuantity = ticketRequest.TicketQuantity;
                        newTicket.SetCreated(organizerId.ToString()); 
                        
                        events.TicketTypes.Add(newTicket);
                    }
                }
            }
            
            return Result.Success();
        }

        private Result HandleEventTagsOperations(Event events, Guid eventId, UpdateEventRequest request)
        {
            if (request.RemoveTagIds != null && request.RemoveTagIds.Any())
            {
                var remainingTagsCount = events.EventTags.Count - request.RemoveTagIds.Count;
                var willAddNewTags = request.AddTagIds != null && request.AddTagIds.Any();
                
                if (remainingTagsCount <= 0 && !willAddNewTags)
                    return ErrorResponse.FailureResult(
                            "Cannot remove all tags. Event must have at least 1 tag.",
                            ErrorCodes.InvalidInput
                        );

                var tagsToRemove = events.EventTags
                    .Where(et => request.RemoveTagIds.Contains(et.TagId))
                    .ToList();

                foreach (var tag in tagsToRemove)
                {
                    events.EventTags.Remove(tag);
                }
            }

            if (request.AddTagIds != null && request.AddTagIds.Any())
            {
                var existingTagIds = events.EventTags.Select(et => et.TagId).ToList();

                foreach (var tagId in request.AddTagIds)
                {
                    if (!existingTagIds.Contains(tagId))
                    {
                        events.EventTags.Add(new EventTag
                        {
                            EventId = eventId,
                            TagId = tagId
                        });
                    }
                }
            }
            
            return Result.Success();
        }

        private Result ValidateEventForPublish(UpdateEventRequest request, Event existingEvent)
        {
            var errors = new List<string>();

            var title = request.Title ?? existingEvent.Title;
            var description = request.Description ?? existingEvent.Description;
            var startTime = request.StartTime ?? existingEvent.StartTime;
            var endTime = request.EndTime ?? existingEvent.EndTime;
            var saleStartTime = request.SaleStartTime ?? existingEvent.SaleStartTime;
            var saleEndTime = request.SaleEndTime ?? existingEvent.SaleEndTime; 
            var totalTickets = request.TotalTickets ?? existingEvent.TotalTickets;
            var ticketPricingType = request.TicketPricingType.HasValue 
                ? request.TicketPricingType.Value 
                : existingEvent.TicketPricingType;

            if (string.IsNullOrWhiteSpace(title))
                errors.Add("Title is required");

            if (string.IsNullOrWhiteSpace(description))
                errors.Add("Description is required");

            if (startTime == default || endTime == default)
                errors.Add("StartTime and EndTime are required");
            else if (endTime < startTime)
                errors.Add("EndTime must be after StartTime");

            if (!saleStartTime.HasValue || !saleEndTime.HasValue)
                errors.Add("SaleStartTime and SaleEndTime are required");
            else
            {
                if (saleEndTime < saleStartTime)
                    errors.Add("SaleEndTime must be after SaleStartTime");

                if (saleEndTime > startTime)
                    errors.Add("SaleEndTime cannot be after event StartTime");
            }

            var locationName = request.LocationName ?? existingEvent.LocationName;
                var district = request.District ?? existingEvent.District;
                var address = request.Address ?? existingEvent.Address;

                if (string.IsNullOrWhiteSpace(locationName))
                    errors.Add("LocationName is required");
                if (string.IsNullOrWhiteSpace(district))
                    errors.Add("District is required");
                if (string.IsNullOrWhiteSpace(address))
                    errors.Add("Address is required");

            var hasImages = HasEventImages(request, existingEvent);
            if (!hasImages)
                errors.Add("At least one event image is required");

            var hasEvidence = HasEventEvidence(request, existingEvent);
            if (!hasEvidence)
                errors.Add("Evidence is required when publishing an event");
              
            var hasTicketDetailsAfterOperations = existingEvent.TicketTypes != null && existingEvent.TicketTypes.Any();
            
            if (request.RemoveTicketTypeIds != null && request.RemoveTicketTypeIds.Any())
            {
                var remainingTicketsCount = (existingEvent.TicketTypes?.Count ?? 0) - request.RemoveTicketTypeIds.Count;
                hasTicketDetailsAfterOperations = remainingTicketsCount > 0;
            }
            
            if (request.TicketTypes != null && request.TicketTypes.Any(td => !td.Id.HasValue || td.Id.Value == Guid.Empty))
                hasTicketDetailsAfterOperations = true;

            if (!hasTicketDetailsAfterOperations)
                errors.Add("At least one ticket type is required");
            
            if (totalTickets <= 0)
                errors.Add("TotalTickets must be greater than 0");

            var eventCategoryId = request.EventCategoryId ?? existingEvent.EventCategoryId;

            if (eventCategoryId == Guid.Empty)
                errors.Add("EventCategoryId is required");

            if (errors.Any())
            {
                return ErrorResponse.FailureResult(
                    string.Join("; ", errors),
                    ErrorCodes.InvalidInput
                );
            }

            return Result.Success();
        }

        private bool HasEventImages(UpdateEventRequest request, Event existingEvent)
        {
            var existingImagesList = string.IsNullOrEmpty(existingEvent.ImgListEvent)
                ? new List<string>()
                : existingEvent.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList();

            if (request.RemoveImageUrls != null && request.RemoveImageUrls.Any())
            {
                existingImagesList = existingImagesList
                    .Where(img => !request.RemoveImageUrls.Contains(img))
                    .ToList();
            }

            var hasNewImages = request.ImgListEvent != null && request.ImgListEvent.Any();
            return existingImagesList.Any() || hasNewImages;
        }

        private bool HasEventEvidence(UpdateEventRequest request, Event existingEvent)
        {
            var existingEvidenceList = string.IsNullOrEmpty(existingEvent.ImgListEvidences)
                ? new List<string>()
                : existingEvent.ImgListEvidences.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList();

            if (request.RemoveImageEvidenceUrls != null && request.RemoveImageEvidenceUrls.Any())
            {
                existingEvidenceList = existingEvidenceList
                    .Where(ev => !request.RemoveImageEvidenceUrls.Contains(ev))
                    .ToList();
            }

            var hasNewEvidence = request.ImgListEvidences != null && request.ImgListEvidences.Any();
            return existingEvidenceList.Any() || hasNewEvidence;
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

        public async Task<Result> DeleteEventAsync(Guid eventId, Guid organizerId, string? reasonCancel)
        {
            if (eventId == Guid.Empty || organizerId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var existingEvent = await _unitOfWork.EventRepository
                .Query()
                .Include(e => e.Bookings)
                .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

            if (existingEvent == null || existingEvent.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.InvalidInput);

            if (existingEvent.Status == EventStatus.Cancelled)
                return ErrorResponse.FailureResult("Event cancelled cannot delete", ErrorCodes.InvalidInput);

            if (existingEvent.OrganizerProfileId != organizerId)
                return ErrorResponse.FailureResult("Cannot delete other people's events", ErrorCodes.Unauthorized);

            var hasBookings = existingEvent.Bookings
                .Where(b => b.Status == BookingStatus.Completed)
                .ToList();

            if (existingEvent.Publish == true && hasBookings.Any())
                if (string.IsNullOrEmpty(reasonCancel))
                    return ErrorResponse.FailureResult("Cancellation of a published event with existing bookings must have a reason.", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            { 
                if (hasBookings.Any() && !string.IsNullOrEmpty(reasonCancel))
                {
                    await _hangfireJobService.EnqueueCancelEventJobAsync(eventId, reasonCancel);
                    return Result.Success();
                }
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
                                                .Where(e => e.StartTime > DateTime.UtcNow 
                                                        && !e.DeletedAt.HasValue 
                                                        && e.Status == EventStatus.Approved
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
                    AverageRating = e.AverageRating,
                    TotalRatings = e.TotalRatings,
                    EndTime = e.EndTime,
                    MinTicketPrice = e.TicketTypes.Any()
                        ? e.TicketTypes.Min(t => t.TicketPrice)
                        : 0,
                    MaxTicketPrice = e.TicketTypes.Any() 
                        ? e.TicketTypes.Max(t => t.TicketPrice)
                        : 0,
                    Description = e.Description,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
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
                    PayoutAmount = e.PayoutAmount,
                    PlatformFee = e.PlatformFee,
                    Status = e.Status,
                    Description = e.Description,
                    TicketPricingType = e.TicketPricingType,
                    LocationName = e.LocationName,
                    TotalAmount = e.TotalAmount,
                    Price = e.TicketTypes != null && e.TicketTypes.Any()
                        ? e.TicketTypes.Min(t => t.TicketPrice)
                        : 0,
                    OrganizedBy = e.OrganizerProfile != null 
                        ? (e.OrganizerProfile.CompanyName ?? e.OrganizerProfile.ContactName) 
                        : string.Empty,
                    TotalPerson = e.TotalTickets,
                    TotalPersonJoin = e.SoldQuantity,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return new BasePaginated<EventsRawResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<BasePaginated<EventsRawResponse>>> GetAllEventStatusAsync(Guid? organizerId, string? search, EventStatus? status = null, int pageNumber = 1, int pageSize = 10)
        {

            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.Publish == true && !e.IsDeleted);

            if(organizerId.HasValue && organizerId != Guid.Empty)
                events = events.Where(e => e.OrganizerProfileId == organizerId);

            if (!string.IsNullOrEmpty(search))
                events = events.Where(e => e.Title.ToLower().Contains(search.ToLower()) ||
                                          (e.Address != null && e.Address.ToLower().Contains(search.ToLower())) ||
                                          e.Description.ToLower().Contains(search.ToLower()));
            if (status != null)
                events = events.Where(e => e.Status == status);

            int totalCount = await events.CountAsync();

            var result = await events
                .OrderByDescending(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventsRawResponse
                {
                    EventId = e.Id,
                    EventCategoryName = e.EventCategory.CategoryName,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
                    PayoutAmount = e.PayoutAmount,
                    PlatformFee = e.PlatformFee,
                    Status = e.Status,
                    Description = e.Description,
                    TicketPricingType = e.TicketPricingType,
                    LocationName = e.LocationName,
                    Price = e.TicketTypes != null && e.TicketTypes.Any()
                        ? e.TicketTypes.Min(t => t.TicketPrice)
                        : 0,
                    OrganizedBy = e.OrganizerProfile != null 
                        ? (e.OrganizerProfile.CompanyName ?? e.OrganizerProfile.ContactName) 
                        : string.Empty,
                    TotalPerson = e.TotalTickets,
                    TotalPersonJoin = e.SoldQuantity,
                    TotalAmount = e.TotalAmount,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return new BasePaginated<EventsRawResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result> ConfirmEventAsync(Guid userId, Guid eventId, ConfirmEventRequest request)
        {
            if (userId == Guid.Empty || eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);
            if (request == null)
                return ErrorResponse.FailureResult("Request cannot be null", ErrorCodes.InvalidInput);

            var entity = await _unitOfWork.EventRepository
                .Query()
                .Include(e => e.OrganizerProfile)
                .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

            if(entity == null)
                return ErrorResponse.FailureResult("Event can not found or is deleted", ErrorCodes.NotFound);

            if (entity.Status != EventStatus.PendingApproval)
                return ErrorResponse.FailureResult("Event has already been processed", ErrorCodes.InvalidInput);

            var eventTitle = entity.Title;
            var organizerUserId = entity.OrganizerProfile?.UserId ?? Guid.Empty;
            var firstImage = !string.IsNullOrEmpty(entity.ImgListEvent)
                ? entity.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
                : null;

            if (request.Status == ConfirmStatus.Approved)
                entity.Status = EventStatus.Approved;
            else
            {
                if (string.IsNullOrWhiteSpace(request.Reason))
                    return ErrorResponse.FailureResult("Reason is required when rejecting", ErrorCodes.InvalidInput);

                entity.ReasonReject = request.Reason.Trim();
                entity.Status = EventStatus.Rejected;
            }

            entity.RequireApprovalAt = DateTime.UtcNow;
            entity.RequireApprovalBy = userId;
            await _unitOfWork.EventRepository.UpdateAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            if (organizerUserId != Guid.Empty)
            {
                var notificationRequest = new CreateNotificationRequest
                {
                    UserId = organizerUserId,
                    Title = request.Status == ConfirmStatus.Approved
                        ? "Sự kiện đã được phê duyệt"
                        : "Sự kiện đã bị từ chối",
                    Message = request.Status == ConfirmStatus.Approved
                        ? $"Sự kiện <strong>{eventTitle}</strong> của bạn đã được <strong>phê duyệt</strong> và sẵn sàng để công khai."
                        : $"Sự kiện <strong>{eventTitle}</strong> của bạn đã <strong>không được phê duyệt</strong>.{(string.IsNullOrEmpty(request.Reason) ? "" : $" Lý do: {request.Reason}")}",
                    Type = request.Status == ConfirmStatus.Approved
                        ? NotificationType.EventApproved
                        : NotificationType.EventRejected,
                    Channel = NotificationChannel.InApp,
                    EventId = eventId,
                    ImageUrl = firstImage
                };

                await _notificationService.CreateNotificationAsync(notificationRequest);
            }

            if (entity.Status == EventStatus.Approved)
            {
                await _hangfireJobService.EnqueueEmbedNewEventJobAsync(eventId);
            }

            return Result.Success();
        }

        public async Task CompleteExpiredEventsAsync()
        {
            var now = DateTime.UtcNow;
            var endedEvents = await _unitOfWork.EventRepository
                .Query()
                .Where(e => e.Status == EventStatus.Approved
                            && e.EndTime <= now
                            && e.Publish == true
                            && !e.IsDeleted)
                .ToListAsync();

            if (!endedEvents.Any()) return;

            foreach (var ev in endedEvents)
            {
                var totalRevenue = ev.TotalAmount;

                var platformFee = totalRevenue * 0.066m + 45000m;
                var netRevenue = totalRevenue - platformFee;

                ev.PlatformFee = platformFee;
                ev.PayoutAmount = netRevenue;
                ev.Status = EventStatus.WaitingForPayout;
                ev.CompletedAt = now;
            }

            await _unitOfWork.EventRepository.UpdateRangeAsync(endedEvents);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
