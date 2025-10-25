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
            
            if (request.TicketDetails != null && request.TicketDetails.Any())
            {
                events.TicketDetails = request.TicketDetails.Select(td =>
                {
                    var ticket = new TicketDetail
                    {
                        Id = Guid.NewGuid(),
                        TicketName = td.TicketName,
                        TicketPrice = td.TicketPrice,
                        TicketQuantity = td.TicketQuantity,
                        TicketDescription = td.TicketDescription,
                        SoldQuantity = 0,
                        RemainingQuantity = td.TicketQuantity,
                        MaxPurchaseQuantity = td.MaxPurchaseQuantity,
                        MinPurchaseQuantity = td.MinPurchaseQuantity,
                        RefundRuleId = !string.IsNullOrEmpty(td.RuleRefundRequestId)
                            ? Guid.Parse(td.RuleRefundRequestId)
                            : null
                    };
                    ticket.SetCreated(organizerId.ToString());
                    return ticket;
                }).ToList();
            }

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
                var now = DateTime.Now;
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
            if (organizerId == Guid.Empty || eventId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var eventQuery = await _unitOfWork.EventRepository
                .Query()
                .Include(e => e.TicketDetails)
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
                    .AnyAsync(b => b.Status == BookingStatus.Completed || b.Status == BookingStatus.Pending);

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

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                _mapper.Map(request, eventQuery);

                await UpdateEventImagesAsync(eventQuery, request);

                await HandleTicketDetailsOperationsAsync(eventQuery, eventId, organizerId, request);

                HandleEventTagsOperations(eventQuery, eventId, request);

                if (request.Publish == true)
                {
                    eventQuery.Publish = true;
                    eventQuery.RequireApproval = ConfirmStatus.NeedConfirm;
                }
                await _unitOfWork.EventRepository.UpdateAsync(eventQuery);

                return Result.Success();
            });
        }

        private async Task UpdateEventImagesAsync(Event events, UpdateEventRequest request)
        {
            if ((request.RemoveImageUrls == null || !request.RemoveImageUrls.Any()) 
                && (request.ImgListEvent == null || !request.ImgListEvent.Any()))
                return;

                var existingImages = string.IsNullOrEmpty(events.ImgListEvent)
                                        ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(events.ImgListEvent) ?? new List<string>();

                if (request.RemoveImageUrls != null && request.RemoveImageUrls.Any())
                {
                var imagesToRemove = request.RemoveImageUrls.Where(url => existingImages.Contains(url)).ToList();
                var remainingImagesCount = existingImages.Count - imagesToRemove.Count;
                var willAddNewImages = request.ImgListEvent != null && request.ImgListEvent.Any();
                
                if (remainingImagesCount <= 0 && !willAddNewImages)
                {
                    throw new InvalidOperationException(
                        "Cannot remove all images. Event must have at least 1 image."
                    );
                }

                var deleteImageTasks = imagesToRemove
                    .Select(url => _cloudinaryService.DeleteImageAsync(url))
                    .ToList();

                await Task.WhenAll(deleteImageTasks);
                existingImages = existingImages.Where(img => !request.RemoveImageUrls.Contains(img)).ToList();
                }

                if (request.ImgListEvent != null && request.ImgListEvent.Any())
                {
                var uploadResults = await Task.WhenAll(
                    request.ImgListEvent.Select(img => _cloudinaryService.UploadImageAsync(img))
                );

                var successfulUploads = uploadResults.Where(url => !string.IsNullOrEmpty(url)).ToList();
                existingImages.AddRange(successfulUploads!);
                }

                events.ImgListEvent = JsonSerializer.Serialize(existingImages);
        }

        private async Task HandleTicketDetailsOperationsAsync(Event events, Guid eventId, Guid organizerId, UpdateEventRequest request)
        { 
            if (request.RemoveTicketDetailIds != null && request.RemoveTicketDetailIds.Any())
            {
                var remainingTicketsCount = events.TicketDetails.Count - request.RemoveTicketDetailIds.Count;
                var willAddNewTickets = request.TicketDetails != null && 
                                       request.TicketDetails.Any(td => !td.Id.HasValue || td.Id.Value == Guid.Empty);
                
                if (remainingTicketsCount <= 0 && !willAddNewTickets)
                {
                    throw new InvalidOperationException(
                        "Cannot remove all ticket details. Event must have at least 1 ticket type."
                    );
                }

                var ticketsToRemove = events.TicketDetails
                    .Where(td => request.RemoveTicketDetailIds.Contains(td.Id))
                    .ToList();

                foreach (var ticket in ticketsToRemove)
                { 
                    var hasSoldTickets = await _unitOfWork.EventRepository
                        .Query()
                        .Where(e => e.Id == eventId)
                        .SelectMany(e => e.TicketDetails)
                        .Where(td => td.Id == ticket.Id)
                        .AnyAsync(td => td.SoldQuantity > 0);

                    if (hasSoldTickets)
                    {
                        throw new InvalidOperationException(
                            $"Cannot remove ticket '{ticket.TicketName}' because it has already been sold"
                        );
                    }

                    events.TicketDetails.Remove(ticket);
                }
            } 
            if (request.TicketDetails != null && request.TicketDetails.Any())
            {
                foreach (var ticketRequest in request.TicketDetails)
                {
                    if (ticketRequest.Id.HasValue && ticketRequest.Id.Value != Guid.Empty)
                    { 
                        var existingTicket = events.TicketDetails.FirstOrDefault(td => td.Id == ticketRequest.Id.Value);
                        
                        if (existingTicket != null)
                        {
                            if (existingTicket.SoldQuantity > 0 && ticketRequest.TicketQuantity < existingTicket.SoldQuantity)
                            {
                                throw new InvalidOperationException(
                                    $"Cannot reduce quantity below sold quantity ({existingTicket.SoldQuantity}) for ticket '{existingTicket.TicketName}'"
                                );
                            }

                            _mapper.Map(ticketRequest, existingTicket);
                            existingTicket.RemainingQuantity = existingTicket.TicketQuantity - existingTicket.SoldQuantity;
                            existingTicket.SetUpdated(organizerId.ToString());
                        }
                    }
                    else
                    {
                        var newTicket = _mapper.Map<TicketDetail>(ticketRequest);
                        newTicket.Id = Guid.NewGuid();
                        newTicket.EventId = eventId;
                        newTicket.SoldQuantity = 0;
                        newTicket.RemainingQuantity = ticketRequest.TicketQuantity;
                        newTicket.SetCreated(organizerId.ToString()); 
                        
                        events.TicketDetails.Add(newTicket);
                    }
                }
            }
        }

        private void HandleEventTagsOperations(Event events, Guid eventId, UpdateEventRequest request)
        {
            if (request.RemoveTagIds != null && request.RemoveTagIds.Any())
            {
                var remainingTagsCount = events.EventTags.Count - request.RemoveTagIds.Count;
                var willAddNewTags = request.AddTagIds != null && request.AddTagIds.Any();
                
                if (remainingTagsCount <= 0 && !willAddNewTags)
                {
                    throw new InvalidOperationException(
                        "Cannot remove all tags. Event must have at least 1 tag."
                    );
                }

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
            var isOnlineEvent = request.isOnlineEvent ?? existingEvent.isOnlineEvent ?? false;
            var totalTickets = request.TotalTickets ?? existingEvent.TotalTickets;
            var ticketType = request.TicketType ?? existingEvent.TicketType;

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

            if (!isOnlineEvent)
            {
                var locationName = request.LocationName ?? existingEvent.LocationName;
                var city = request.City ?? existingEvent.City;
                var address = request.Address ?? existingEvent.Address;

                if (string.IsNullOrWhiteSpace(locationName))
                    errors.Add("LocationName is required for offline events");
                if (string.IsNullOrWhiteSpace(city))
                    errors.Add("City is required for offline events");
                if (string.IsNullOrWhiteSpace(address))
                    errors.Add("Address is required for offline events");
            }
            else
            {
                var linkRef = request.LinkRef ?? existingEvent.LinkRef;
                if (string.IsNullOrWhiteSpace(linkRef))
                    errors.Add("LinkRef is required for online events");
            }

            var hasImages = HasEventImages(request, existingEvent);
            if (!hasImages)
                errors.Add("At least one event image is required");

            if (request.TicketDetails != null && request.TicketDetails.Any())
            {
                if (request.TicketDetails.Any(td => td.MaxPurchaseQuantity < td.MinPurchaseQuantity))
                    errors.Add("MaxPurchaseQuantity must be greater than or equal to MinPurchaseQuantity");
            }
            
            var hasTicketDetailsAfterOperations = existingEvent.TicketDetails != null && existingEvent.TicketDetails.Any();
            
            if (request.RemoveTicketDetailIds != null && request.RemoveTicketDetailIds.Any())
            {
                var remainingTicketsCount = (existingEvent.TicketDetails?.Count ?? 0) - request.RemoveTicketDetailIds.Count;
                hasTicketDetailsAfterOperations = remainingTicketsCount > 0;
            }
            
            if (request.TicketDetails != null && request.TicketDetails.Any(td => !td.Id.HasValue || td.Id.Value == Guid.Empty))
            {
                hasTicketDetailsAfterOperations = true; 
            }
            
            if (!hasTicketDetailsAfterOperations)
                errors.Add("At least one ticket type is required");
            
            if (totalTickets <= 0)
                errors.Add("TotalTickets must be greater than 0");

            if (ticketType == default)
                errors.Add("TicketType is required");

            var eventCategoryId = !string.IsNullOrWhiteSpace(request.EventCategoryId)
                ? request.EventCategoryId
                : existingEvent.EventCategoryId.ToString();

            if (string.IsNullOrWhiteSpace(eventCategoryId) || eventCategoryId == Guid.Empty.ToString())
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
                : JsonSerializer.Deserialize<List<string>>(existingEvent.ImgListEvent ?? "[]") ?? new List<string>();

            if (request.RemoveImageUrls != null && request.RemoveImageUrls.Any())
            {
                existingImagesList = existingImagesList
                    .Where(img => !request.RemoveImageUrls.Contains(img))
                    .ToList();
            }

            var hasNewImages = request.ImgListEvent != null && request.ImgListEvent.Any();
            return existingImagesList.Any() || hasNewImages;
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
                    Status = e.RequireApproval,
                    Description = e.Description,
                    TicketType = e.TicketType,
                    LocationName = e.LocationName,
                    Price = e.TicketDetails != null && e.TicketDetails.Any()
                        ? e.TicketDetails.Min(t => t.TicketPrice)
                        : 0,
                    OrganizedBy = e.OrganizerProfile != null 
                        ? (e.OrganizerProfile.CompanyName ?? e.OrganizerProfile.ContactName) 
                        : string.Empty,
                    TotalPerson = e.TotalTickets,
                    TotalPersonJoin = e.SoldQuantity,
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

            if(organizerId.HasValue && organizerId != Guid.Empty)
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
                    Status = e.RequireApproval,
                    Description = e.Description,
                    TicketType = e.TicketType,
                    LocationName = e.LocationName,
                    Price = e.TicketDetails != null && e.TicketDetails.Any()
                        ? e.TicketDetails.Min(t => t.TicketPrice)
                        : 0,
                    OrganizedBy = e.OrganizerProfile != null 
                        ? (e.OrganizerProfile.CompanyName ?? e.OrganizerProfile.ContactName) 
                        : string.Empty,
                    TotalPerson = e.TotalTickets,
                    TotalPersonJoin = e.SoldQuantity,
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
