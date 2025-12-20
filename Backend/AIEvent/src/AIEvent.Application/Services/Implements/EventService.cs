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
using Microsoft.Extensions.Logging;
using PayOS.Models.V1.Payouts;

namespace AIEvent.Application.Services.Implements
{
    public class EventService : IEventService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITransactionHelper _transactionHelper;
        private readonly IMapper _mapper;
        private readonly IHangfireJobService _hangfireJobService;
        private readonly INotificationService _notificationService;
        private readonly IPayOSService _payOSService;
        private readonly ILogger<EventService> _logger;
        private readonly IPineconeVectorService _pineconeVectorService;

        public EventService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IMapper mapper, 
            IHangfireJobService hangfireJobService, INotificationService notificationService, IPayOSService payOSService,
            ILogger<EventService> logger, IPineconeVectorService pineconeVectorService)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _mapper = mapper;
            _hangfireJobService = hangfireJobService;
            _notificationService = notificationService;
            _payOSService = payOSService;
            _logger = logger;
            _pineconeVectorService = pineconeVectorService;
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
            events.TicketTypes.ToList().ForEach(tt => tt.SetCreated(organizerId.ToString()));
            
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
                                                                                string? district, 
                                                                                TimeLine? timeLine,
                                                                                TicketSaleStatus? ticketSaleStatus,    
                                                                                EventProgressStatus? eventProgressStatus, 
                                                                                decimal? minPrice,                      
                                                                                decimal? maxPrice,                     
                                                                                EventSortBy? sortBy = EventSortBy.NearestTime, 
                                                                                int pageNumber = 1, 
                                                                                int pageSize = 5)
        {
            var now = DateTime.UtcNow;
            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.EndTime.AddDays(7) > DateTime.UtcNow 
                                                    && !e.DeletedAt.HasValue 
													&& e.Status != EventStatus.Rejected
													&& e.Status != EventStatus.Cancelled
													&& e.Status != EventStatus.PendingApproval
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

            if (!string.IsNullOrEmpty(district))
                events = events
                                .Where(e => (e.District ?? string.Empty).ToLower().Contains(district.ToLower()));

            if (timeLine.HasValue)
            {
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

            if (ticketSaleStatus.HasValue)
            {
                switch (ticketSaleStatus.Value)
                {
                    case TicketSaleStatus.NotStarted:
                        events = events.Where(e => !e.SaleStartTime.HasValue || e.SaleStartTime > now);
                        break;
                    case TicketSaleStatus.OnSale:
                        events = events.Where(e =>
                            e.SaleStartTime.HasValue && e.SaleStartTime <= now &&
                            (!e.SaleEndTime.HasValue || e.SaleEndTime >= now));
                        break;
                    case TicketSaleStatus.SaleEnded:
                        events = events.Where(e =>
                            e.SaleEndTime.HasValue && e.SaleEndTime < now);
                        break;
                }
            }

            if (eventProgressStatus.HasValue)
            {
                switch (eventProgressStatus.Value)
                {
                    case EventProgressStatus.Upcoming:
                        events = events.Where(e => e.StartTime > now);
                        break;
                    case EventProgressStatus.Ongoing:
                        events = events.Where(e => e.StartTime <= now && e.EndTime >= now);
                        break;
                    case EventProgressStatus.Ended:
                        events = events.Where(e => e.EndTime < now);
                        break;
                }
            }

            if (minPrice.HasValue || maxPrice.HasValue)
            {
                events = events.Where(e => e.TicketTypes.Any());

                if (minPrice.HasValue)
                    events = events.Where(e => e.TicketTypes.Min(tt => tt.TicketPrice) >= minPrice.Value);

                if (maxPrice.HasValue)
                    events = events.Where(e => e.TicketTypes.Min(tt => tt.TicketPrice) <= maxPrice.Value);
            }

            int totalCount = await events.CountAsync();

            events = sortBy switch
            {
                EventSortBy.NearestTime => events.OrderBy(e => e.StartTime),
                EventSortBy.LatestTime => events.OrderByDescending(e => e.StartTime),
                EventSortBy.LowestPrice => events
                    .OrderBy(e => e.TicketTypes.Any() ? e.TicketTypes.Min(tt => tt.TicketPrice) : decimal.MaxValue),
                EventSortBy.HighestPrice => events
                    .OrderByDescending(e => e.TicketTypes.Any() ? e.TicketTypes.Max(tt => tt.TicketPrice) : 0),
                _ => events.OrderBy(e => e.StartTime) 
            };

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
                    FavoriteCount = e.FavoriteEvents.Count(),
                    SaleStartTime = e.SaleStartTime,
                    SaleEndTime = e.SaleEndTime,
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
                .Include(e => e.EventTags)
                .Where(e => e.Id == eventId && !e.IsDeleted)
                .FirstOrDefaultAsync();

            if (eventQuery == null)
                return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            if (eventQuery.OrganizerProfileId != organizerId)
                return ErrorResponse.FailureResult("You don't have permission to update this event", ErrorCodes.Unauthorized);
             
            var hasBookings = await _unitOfWork.EventRepository
                .Query()
                .Where(e => e.Id == eventId)
                .SelectMany(e => e.Bookings)
                .AnyAsync(b => b.Status == BookingStatus.Completed);

            if (hasBookings)
                return ErrorResponse.FailureResult("Cannot update event that has existing bookings", ErrorCodes.InvalidInput);
              
            if (eventQuery.Publish == true && eventQuery.Status != EventStatus.PendingApproval)
                return ErrorResponse.FailureResult("Cannot update published event that is not in pending approval status", ErrorCodes.InvalidInput);
              
            if (request.Publish == true && !await IsValidForPublishAsync(request, eventQuery))
                return ErrorResponse.FailureResult("Event data is incomplete for publishing", ErrorCodes.InvalidInput);

            var result = await _transactionHelper.ExecuteInTransactionAsync(async () =>
            { 
                _mapper.Map(request, eventQuery);
                   
                eventQuery.SoldQuantity = 0;
 
                await UpdateEventImagesAsync(eventQuery, request);
                await UpdateEventEvidenceAsync(eventQuery, request);
                 
                await HandleTicketDetailsOperationsAsync(eventQuery, eventId, organizerId, request);

                if (request.TicketTypes != null && request.TicketTypes.Any() ||
                    request.RemoveTicketTypeIds != null && request.RemoveTicketTypeIds.Any())
                { 
                    var totalTickets = await _unitOfWork.TicketTypeRepository
                        .Query()
                        .Where(t => t.EventId == eventId)
                        .SumAsync(t => t.TicketQuantity);
                    eventQuery.TotalTickets = totalTickets;
                    eventQuery.RemainingTickets = eventQuery.TotalTickets;
                }
                else if (request.TotalTickets.HasValue)
                {
                    eventQuery.TotalTickets = request.TotalTickets.Value;
                    eventQuery.RemainingTickets = eventQuery.TotalTickets;
                }
                else
                    eventQuery.RemainingTickets = eventQuery.TotalTickets;

                HandleEventTagsOperations(eventQuery, eventId, request);
                 
                if (request.Publish == true)
                {
					eventQuery.Status = EventStatus.PendingApproval;
                    eventQuery.Publish = true;
				}
                    

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
                        TargetRoles = new List<Guid> { managerRole.Id },
                        EventId = eventId,
                        ImageUrl = firstImage
                    };

                    await _notificationService.CreateNotificationToAllAsync(notificationRequest);
                }
            }

            await _hangfireJobService.EnqueueEmbedNewEventJobAsync(eventId);

            return result;
        }

        private Task UpdateEventImagesAsync(Event events, UpdateEventRequest request)
        {
            if ((request.RemoveImageUrls == null || !request.RemoveImageUrls.Any()) 
                && (request.ImgListEvent == null || !request.ImgListEvent.Any()))
                return Task.CompletedTask;

            var existingImages = string.IsNullOrEmpty(events.ImgListEvent)
                ? new List<string>()
                : events.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList();
             
            if (request.RemoveImageUrls != null && request.RemoveImageUrls.Any())
                existingImages = existingImages.Where(img => !request.RemoveImageUrls.Contains(img)).ToList();
             
            if (request.ImgListEvent != null && request.ImgListEvent.Any())
            {
                var newImageUrls = request.ImgListEvent
                    .Where(url => !string.IsNullOrWhiteSpace(url) && !existingImages.Contains(url))
                    .ToList();
                existingImages.AddRange(newImageUrls);
            }

            events.ImgListEvent = existingImages.Any() ? string.Join(", ", existingImages) : null;
            return Task.CompletedTask;
        }

        private Task UpdateEventEvidenceAsync(Event events, UpdateEventRequest request)
        {
            if ((request.RemoveImageEvidenceUrls == null || !request.RemoveImageEvidenceUrls.Any()) 
                && (request.ImgListEvidences == null || !request.ImgListEvidences.Any()))
                return Task.CompletedTask;

            var existingEvidence = string.IsNullOrEmpty(events.ImgListEvidences)
                ? new List<string>()
                : events.ImgListEvidences.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList();
             
            if (request.RemoveImageEvidenceUrls != null && request.RemoveImageEvidenceUrls.Any())
                existingEvidence = existingEvidence.Where(ev => !request.RemoveImageEvidenceUrls.Contains(ev)).ToList();
             
            if (request.ImgListEvidences != null && request.ImgListEvidences.Any())
            {
                var newEvidenceUrls = request.ImgListEvidences
                    .Where(url => !string.IsNullOrWhiteSpace(url) && !existingEvidence.Contains(url))
                    .ToList();
                existingEvidence.AddRange(newEvidenceUrls);
            }

            events.ImgListEvidences = existingEvidence.Any() ? string.Join(", ", existingEvidence) : null;
            return Task.CompletedTask;
        }

        private async Task HandleTicketDetailsOperationsAsync(Event events, Guid eventId, Guid organizerId, UpdateEventRequest request)
        {  
            if (request.RemoveTicketTypeIds != null && request.RemoveTicketTypeIds.Any())
            {
                var ticketsToRemove = await _unitOfWork.TicketTypeRepository
                    .Query()
                    .Where(td => request.RemoveTicketTypeIds.Contains(td.Id) && td.EventId == eventId)
                    .ToListAsync();

                foreach (var ticket in ticketsToRemove)
                    await _unitOfWork.TicketTypeRepository.DeleteAsync(ticket);
            }

            if (request.TicketTypes != null && request.TicketTypes.Any())
            {
                var ticketTypeAdds = new List<TicketType>();
                var ticketTypeUpdates = new List<TicketType>();
                foreach (var ticketRequest in request.TicketTypes)
                {
                    if (ticketRequest.Id.HasValue && ticketRequest.Id.Value != Guid.Empty)
                    {
                        var existingTicket = await _unitOfWork.TicketTypeRepository
                            .Query()
                            .FirstOrDefaultAsync(t => t.Id == ticketRequest.Id.Value && t.EventId == eventId);
                        if (existingTicket != null)
                        {
                            _mapper.Map(ticketRequest, existingTicket);
                            existingTicket.SoldQuantity = 0;
                            existingTicket.RemainingQuantity = existingTicket.TicketQuantity;
                            existingTicket.SetUpdated(organizerId.ToString());
                            ticketTypeUpdates.Add(existingTicket);
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
                        ticketTypeAdds.Add(newTicket);
                    }
                }

                if(ticketTypeUpdates.Any())
                    await _unitOfWork.TicketTypeRepository.UpdateRangeAsync(ticketTypeUpdates);

                if (ticketTypeAdds.Any())
                    await _unitOfWork.TicketTypeRepository.AddRangeAsync(ticketTypeAdds);
            }

            await Task.CompletedTask;
        }

        private void HandleEventTagsOperations(Event events, Guid eventId, UpdateEventRequest request)
        { 
            if (request.RemoveTagIds != null && request.RemoveTagIds.Any())
            {
                var tagsToRemove = events.EventTags
                    .Where(et => request.RemoveTagIds.Contains(et.TagId))
                    .ToList();

                foreach (var tag in tagsToRemove)
                    events.EventTags.Remove(tag);
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

        private async Task<bool> IsValidForPublishAsync(UpdateEventRequest request, Event existingEvent)
        {
            var title = request.Title ?? existingEvent.Title;
            var description = request.Description ?? existingEvent.Description;
            var startTime = request.StartTime ?? existingEvent.StartTime;
            var endTime = request.EndTime ?? existingEvent.EndTime;
            var saleStartTime = request.SaleStartTime ?? existingEvent.SaleStartTime;
            var saleEndTime = request.SaleEndTime ?? existingEvent.SaleEndTime;
            var locationName = request.LocationName ?? existingEvent.LocationName;
            var district = request.District ?? existingEvent.District;
            var address = request.Address ?? existingEvent.Address;
            var eventCategoryId = request.EventCategoryId ?? existingEvent.EventCategoryId;
            var totalTickets = request.TotalTickets ?? existingEvent.TotalTickets;
             
            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(description) ||
                string.IsNullOrWhiteSpace(locationName) || string.IsNullOrWhiteSpace(district) ||
                string.IsNullOrWhiteSpace(address) || eventCategoryId == Guid.Empty || totalTickets <= 0)
                return false;
             
            if (startTime == default || endTime == default || endTime < startTime ||
                !saleStartTime.HasValue || !saleEndTime.HasValue ||
                saleEndTime < saleStartTime || saleEndTime > startTime)
                return false;
              
            if (!HasEventImages(request, existingEvent) || !HasEventEvidence(request, existingEvent))
                return false; 

            var existingTicketCount = await _unitOfWork.TicketTypeRepository
                .Query()
                .Where(t => t.EventId == existingEvent.Id)
                .CountAsync();
                
            var hasTickets = existingTicketCount > 0;
            if (request.RemoveTicketTypeIds?.Any() == true)
            {
                var remainingCount = existingTicketCount - request.RemoveTicketTypeIds.Count;
                hasTickets = remainingCount > 0;
            }
            if (request.TicketTypes?.Any(td => !td.Id.HasValue || td.Id.Value == Guid.Empty) == true)
                hasTickets = true;

            return hasTickets;
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

                await _pineconeVectorService.DeleteVectorAsync(eventId.ToString(), isUser: false);

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
                    FavoriteCount = e.FavoriteEvents.Count(),
                    SaleStartTime = e.SaleStartTime,
                    SaleEndTime = e.SaleEndTime,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return new BasePaginated<EventsRawResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<BasePaginated<EventsRawResponse>>> GetAllEventStatusAsync(Guid? organizerId, string? search, EventStatus? status = null, DateTime? startDate = null, DateTime? endDate = null, int pageNumber = 1, int pageSize = 10)
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

            if (startDate.HasValue)
                events = events.Where(e => e.StartTime >= startDate.Value);

            if (endDate.HasValue)
                events = events.Where(e => e.StartTime <= endDate.Value);

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
                    IsFlagWarning = e.IsFlagWarning,
                    FavoriteCount = e.FavoriteEvents.Count(),
                    ReasonCancel = e.ReasonCancel,
                    SaleStartTime = e.SaleStartTime,
                    SaleEndTime = e.SaleEndTime,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            var allSystemSettings = await _unitOfWork.SystemSettingRepository
                .Query()
                .AsNoTracking()
                .Where(s => !s.IsDeleted)
                .OrderByDescending(s => s.UpdatedAt)
                .ToListAsync();

            foreach (var eventResponse in result)
            {
                SystemSetting? setting = null;
                if (eventResponse.SaleStartTime.HasValue)
                {
                    setting = allSystemSettings
                        .Where(s => s.UpdatedAt <= eventResponse.SaleStartTime.Value)
                        .OrderByDescending(s => s.UpdatedAt)
                        .FirstOrDefault();
                }
                
                if (setting != null)
                {
                    eventResponse.FlatformFee = setting.FlatformFee;
                    eventResponse.FixFee = setting.FixFee;
                    eventResponse.DatePayout = setting.DatePayout;
                }
            }

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

                if (!endedEvents.Any())
                {
                    _logger.LogInformation("No expired events found to process");
                    return;
                }
                var allSettings = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted)
                    .OrderByDescending(s => s.UpdatedAt)
                    .ToListAsync();

                if (!allSettings.Any())
                {
                    _logger.LogWarning("No SystemSettings found. Cannot process expired events.");
                    return;
                }

                var settingCache = new Dictionary<string, SystemSetting>();

                foreach (var ev in endedEvents)
                {
                    var saleStart = ev.SaleStartTime!.Value;

                    var key = $"{saleStart:yyyy-MM}";

                    if (!settingCache.TryGetValue(key, out var setting))
                    {
                        setting = allSettings
                            .FirstOrDefault(s => s.UpdatedAt <= saleStart)
                            ?? allSettings.Last();

                        settingCache[key] = setting;
                    }

                    var totalRevenue = ev.TotalAmount;
                    decimal platformFee = totalRevenue * setting.FlatformFee + setting.FixFee;
                    decimal netRevenue = totalRevenue - platformFee;

                    if (netRevenue >= 0)
                    {
                        ev.PlatformFee = platformFee;
                        ev.PayoutAmount = netRevenue;
                        ev.Status = EventStatus.WaitingForPayout;
                        _logger.LogInformation("Event {EventId} ({Title}) set to WaitingForPayout. Revenue: {Revenue:N0}, PlatformFee: {PlatformFee:N0}, NetRevenue: {NetRevenue:N0}",
                            ev.Id, ev.Title, totalRevenue, platformFee, netRevenue);
                    }
                    else
                    {
                        var payoutDate = DateTime.UtcNow;
                        ev.PlatformFee = platformFee;
                        ev.PayoutAmount = 0;
                        ev.Status = EventStatus.PaidOut;
                        ev.PaidOutAt = payoutDate;

                        var revenueReport = new RevenueReport
                        {
                            OrganizerProfileId = ev.OrganizerProfileId,
                            EventId = ev.Id,
                            EventName = ev.Title,
                            GrossRevenue = 0,
                            PlatformFee = platformFee,
                            NetRevenue = 0,
                            ReportMonth = payoutDate.Month,
                            ReportYear = payoutDate.Year,
                            PayoutDate = null
                        };

                        await _unitOfWork.RevenueReportRepository.AddAsync(revenueReport);
                        await _unitOfWork.SaveChangesAsync();
                        _logger.LogInformation("Event {EventId} ({Title}) set to PaidOut with zero revenue. RevenueReport created.", ev.Id, ev.Title);
                    }

                    ev.CompletedAt = now;
                    await _pineconeVectorService.DeleteVectorAsync(ev.Id.ToString(), isUser: false);

                }

            await _unitOfWork.EventRepository.UpdateRangeAsync(endedEvents);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<Result> ReportEventAsyncs(Guid userId, ReportEventRequest request)
        {
            try
            {
                if (!Guid.TryParse(request.EventId, out var eventId))
                    return ErrorResponse.FailureResult("Invalid event ID format", ErrorCodes.InvalidInput);

                var eventEntity = await _unitOfWork.EventRepository
                    .Query()
                    .AsNoTracking()
                    .Where(e => e.Id == eventId && !e.IsDeleted && e.Publish == true && e.Status != EventStatus.Cancelled)
                    .Select(e => new { e.Id, e.EndTime, e.Title })
                    .FirstOrDefaultAsync();

                if (eventEntity == null)
                    return ErrorResponse.FailureResult("Event not found or unavailable", ErrorCodes.NotFound);

                if (eventEntity.EndTime > DateTime.Now)
                    return ErrorResponse.FailureResult("You can only report after the event has ended", ErrorCodes.InvalidInput);

                var hasBooked = await _unitOfWork.TicketRepository
                    .Query()
                    .AsNoTracking()
                    .AnyAsync(t => t.UserId == userId && t.TicketType.EventId == eventId && t.Status == TicketStatus.Used);

                if (!hasBooked)
                    return ErrorResponse.FailureResult("You can only report events you booked and join", ErrorCodes.PermissionDenied);

                var alreadyReported = await _unitOfWork.EventReportRepository
                    .Query()
                    .AsNoTracking()
                    .AnyAsync(r => r.UserId == userId && r.EventId == eventId && !r.IsDeleted);

                if (alreadyReported)
                    return ErrorResponse.FailureResult("You have already reported this event", ErrorCodes.InvalidInput);

                var report = new EventReport
                {
                    EventId = eventId,
                    UserId = userId,
                    Type = request.Type,
                    Reason = request.Reason,
                    AttachmentUrl = request.AttachmentUrl,
                };

                await _unitOfWork.EventReportRepository.AddAsync(report);

                var managerRole = await _unitOfWork.RoleRepository
                    .Query()
                    .AsNoTracking()
                    .Select(r => new { r.Id, r.Name, r.IsDeleted })
                    .FirstOrDefaultAsync(r => !r.IsDeleted && r.Name == "Manager");

                if (managerRole == null)
                    return ErrorResponse.FailureResult("Role 'Manager' not found", ErrorCodes.NotFound);

                await _notificationService.CreateNotificationToAllAsync(new CreateNotificationToAllRequest
                {
                    EventId = eventId,
                    Title = $"Báo cáo mới về sự kiện '{eventEntity.Title}'",
                    Message = $"Một người dùng vừa báo cáo sự kiện '{eventEntity.Title}' về vấn đề '{report.Type.GetDescription()}'",
                    Type = NotificationType.ReportEvent,
                    TargetRoles = [managerRole.Id]
                });

                await _unitOfWork.SaveChangesAsync();

                return Result.Success();
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public async Task<Result<BasePaginated<ListReportResponse>>> GetAllReportByEventId(int pageNumber, int pageSize, 
                                                                                          string eventId, EventReportType? type)
        {
            if (!Guid.TryParse(eventId, out var Id))
                return ErrorResponse.FailureResult("Invalid event ID format", ErrorCodes.InvalidInput);

            var reports = _unitOfWork.EventReportRepository
                .Query()
                .AsNoTracking()
                .Where(r => r.EventId == Id && r.IsDeleted == false)
                .Select(r => new
                {
                    r.Id,
                    r.Reason,
                    r.Type,
                    r.CreatedAt,
                    r.User.FullName,
                    r.User.Email,
                    r.Reply
                });

            if (type.HasValue)
            {
                reports = reports.Where(r => r.Type == type);
            }

            int totalCount = await reports.CountAsync();

            var result = await reports
                .OrderByDescending(r => r.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new ListReportResponse
                {
                    Id = e.Id,
                    UserEmail = e.Email!,
                    UserName = e.FullName!,
                    Reason = e.Reason,
                    Type = e.Type,
                    Reply = e.Reply,
                    CreatedAt = e.CreatedAt,
                })
                .ToListAsync();

            return new BasePaginated<ListReportResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<ReportResponse>> GetEventReportDetailAsync(string id)
        {
            if (!Guid.TryParse(id, out var reportId))
                return ErrorResponse.FailureResult("Invalid ID format", ErrorCodes.InvalidInput);

            var report = await _unitOfWork.EventReportRepository
                .Query(false)
                .Where(r => r.Id == reportId && !r.IsDeleted)
                .Select(r => new ReportResponse
                {
                    UserName = r.User.FullName!,
                    UserEmail = r.User.Email!,
                    Type = r.Type,
                    Reason = r.Reason,
                    AttachmentUrl = r.AttachmentUrl,
                    Reply = r.Reply,
                    CreatedAt = r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (report == null)
                return ErrorResponse.FailureResult("Report not found", ErrorCodes.NotFound);

            return Result<ReportResponse>.Success(report);
        }

        public async Task<Result> ReplyReportAsync(string id, ReplyReportRequest request)
        {
            if (!Guid.TryParse(id, out var reportId))
                return ErrorResponse.FailureResult("Invalid ID format", ErrorCodes.InvalidInput);

            var report = await _unitOfWork.EventReportRepository
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == reportId && !r.IsDeleted);

            if (report == null)
                return ErrorResponse.FailureResult("Report not found", ErrorCodes.NotFound);

            report.Reply = request.Reply;

            var eventEntity = await _unitOfWork.EventRepository
                .Query()
                .Select(e => new {e.Title, e.Id, e.IsDeleted})
                .FirstOrDefaultAsync(e => e.Id == report.EventId && !e.IsDeleted);
            if (eventEntity == null)
                return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
            {
                EventId = report.EventId,
                UserId = report.UserId,
                Title = $"Báo cáo sự kiện '{eventEntity.Title}'",
                Message = $"Báo cáo sự kiện '{eventEntity.Title}' về vấn đề '{report.Type.GetDescription()}' của bạn đã được phản hồi",
                Type = NotificationType.ReportEvent,
            });

            await _unitOfWork.EventReportRepository.UpdateAsync(report);
            await _unitOfWork.SaveChangesAsync();

            return Result.Success();
        }

        public async Task<Result<ReportResponse>> GetEventReportOfUserAsync(Guid userId, string id)
        {
            if (!Guid.TryParse(id, out var eventId))
                return ErrorResponse.FailureResult("Invalid ID format", ErrorCodes.InvalidInput);

            var report = await _unitOfWork.EventReportRepository
                .Query(false)
                .Where(r => r.EventId == eventId && r.UserId == userId && !r.IsDeleted)
                .Select(r => new ReportResponse
                {
                    UserName = r.User.FullName!,
                    UserEmail = r.User.Email!,
                    Type = r.Type,
                    Reason = r.Reason,
                    AttachmentUrl = r.AttachmentUrl,
                    Reply = r.Reply,
                    CreatedAt = r.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (report == null)
                return ErrorResponse.FailureResult("Report not found", ErrorCodes.NotFound);

            return Result<ReportResponse>.Success(report);
        }

        public async Task<Result<BasePaginated<ListEventResponse>>> GetAllEventForStaff(Guid staffId, string? title, string? eventCategoryId, 
                                                                                        int pageNumber, int pageSize)
        {
            var staffProfile = await _unitOfWork.StaffProfileRepository
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == staffId && !s.IsDeleted);

            if (staffProfile == null)
                return ErrorResponse.FailureResult("Staff not found", ErrorCodes.NotFound);

            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.EndTime >= DateTime.UtcNow
                                                        && !e.DeletedAt.HasValue
                                                        && e.Status == EventStatus.Approved && e.Publish == true
                                                        && e.OrganizerProfileId == staffProfile.OrganizerProfileId);

            if (!string.IsNullOrEmpty(title))
                events = events.Where(e => e.Title.ToLower().Contains(title.ToLower()));

            if (!string.IsNullOrEmpty(eventCategoryId))
                events = events.Where(e => e.EventCategoryId == Guid.Parse(eventCategoryId));

            int totalCount = await events.CountAsync();

            var result = await events
                .OrderBy(e => e.StartTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new ListEventResponse
                {
                    EventId = e.Id,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime,
                    LocationName = e.LocationName,
                    SoldQuantity = e.SoldQuantity,
                    TotalTickets = e.TotalTickets,
                    Tags = e.EventTags.Select(t => new TagResponse
                    {
                        TagId = t.TagId.ToString(),
                        TagName = t.Tag.NameTag
                    }).ToList(),
                    EventCategoryName = e.EventCategory.CategoryName,
                    Description = e.Description,
                    ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
                        ? new List<string>()
                        : e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return new BasePaginated<ListEventResponse>(result, totalCount, pageNumber, pageSize);
        }

        public async Task<Result<BasePaginated<EventsLocationResponse>>> GetAllEventByRadius(Guid userId, int? radius, string? eventCategoryId,
                                                                                        double latitude, double longitude,
                                                                                        int pageNumber, int pageSize)
        {
            double userLat = latitude;
            double userLon = longitude;
            double radiusKm = radius!.Value;

            double ToRad(double angle) => Math.PI * angle / 180.0;

            double latRad = ToRad(userLat);
            double lonRad = ToRad(userLon);

            IQueryable<Event> query = _unitOfWork.EventRepository
                .Query()
                .AsNoTracking()
                .Where(e =>
                    !e.IsDeleted &&
                    e.Publish == true &&
                    e.Status == EventStatus.Approved &&
                    e.StartTime > DateTime.UtcNow &&
                    e.Latitude != 0 && e.Longitude != 0
                );

            if (!string.IsNullOrEmpty(eventCategoryId))
            {
                Guid catId = Guid.Parse(eventCategoryId);
                query = query.Where(e => e.EventCategoryId == catId);
            }

            var queryWithDistance = query
            .Select(e => new
            {
                Event = e,
                Distance = 6371 *
                           2 * Math.Asin(
                               Math.Sqrt(
                                   Math.Pow(Math.Sin((Math.PI * e.Latitude / 180.0 - latRad) / 2), 2) +
                                   Math.Cos(latRad) *
                                   Math.Cos(Math.PI * e.Latitude / 180.0) *
                                   Math.Pow(Math.Sin((Math.PI * e.Longitude / 180.0 - lonRad) / 2), 2)
                               )
                           )
            })
            .Where(x => x.Distance <= radiusKm);

            int totalCount = await queryWithDistance.CountAsync();

            var result = await queryWithDistance
                .OrderBy(x => x.Event.StartTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EventsLocationResponse
                {
                    EventId = e.Event.Id,
                    EventCategoryName = e.Event.EventCategory.CategoryName,
                    Title = e.Event.Title,
                    StartTime = e.Event.StartTime,
                    EndTime = e.Event.EndTime,
                    Description = e.Event.Description,
                    TotalTickets = e.Event.TotalTickets,
                    SoldQuantity = e.Event.SoldQuantity,
                    LocationName = e.Event.LocationName,
                    Publish = e.Event.Publish,
                    AverageRating = e.Event.AverageRating,
                    TotalRatings = e.Event.TotalRatings,
                    Status = e.Event.Status,
                    Latitude = e.Event.Latitude,
                    Longitude = e.Event.Longitude,

                    Tags = e.Event.EventTags.Select(t => new TagResponse
                    {
                        TagId = t.TagId.ToString(),
                        TagName = t.Tag.NameTag
                    }).ToList(),

                    TicketPrice = e.Event.TicketTypes != null
                        ? e.Event.TicketTypes.Min(t => t.TicketPrice)
                        : 0,

                    IsFavorite = userId != Guid.Empty
                        && e.Event.FavoriteEvents.Any(fe => fe.UserId == userId),
                    FavoriteCount = e.Event.FavoriteEvents.Count(),
                    SaleStartTime = e.Event.SaleStartTime,
                    SaleEndTime = e.Event.SaleEndTime,

                    ImgListEvent = string.IsNullOrEmpty(e.Event.ImgListEvent)
                        ? new List<string>()
                        : e.Event.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList(),
                })
                .ToListAsync();

            return new BasePaginated<EventsLocationResponse>(result, totalCount, pageNumber, pageSize);
        }

		public async Task<Result<BasePaginated<EventsResponse>>> GetEventByOrganizerAsync(Guid? userId,
																		Guid? organizerId,
																		string? search,
																		int pageNumber = 1,
																		int pageSize = 5)
		{
			IQueryable<Event> events = _unitOfWork.EventRepository
												.Query()
												.AsNoTracking()
												.Where(e => !e.DeletedAt.HasValue
													&& e.Status != EventStatus.Rejected
													&& e.Status != EventStatus.Cancelled
													&& e.Status != EventStatus.PendingApproval

													&& e.Publish == true);
			if (organizerId.HasValue && organizerId != Guid.Empty)
				events = events.Where(e => e.OrganizerProfileId == organizerId);

			if (!string.IsNullOrEmpty(search))
				events = events
								.Where(e => e.Title.ToLower().Contains(search.ToLower()));

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
					FavoriteCount = e.FavoriteEvents.Count(),
					SaleStartTime = e.SaleStartTime,
					SaleEndTime = e.SaleEndTime,
					ImgListEvent = string.IsNullOrEmpty(e.ImgListEvent)
						? new List<string>()
						: e.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
				})
				.ToListAsync();

			return new BasePaginated<EventsResponse>(result, totalCount, pageNumber, pageSize);
		}

		public async Task<Result> CancelEventAsync(Guid eventId, CancelEventRequest request)
		{
			if (eventId == Guid.Empty)
				return ErrorResponse.FailureResult("Invalid eventId", ErrorCodes.InvalidInput);

			if (request == null)
				return ErrorResponse.FailureResult("Request cannot be null", ErrorCodes.InvalidInput);

			var existingEvent = await _unitOfWork.EventRepository
				.Query()
				.Include(e => e.OrganizerProfile!)
					.ThenInclude(o => o.User)
				.Include(e => e.Bookings)
				.FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

			if (existingEvent == null || existingEvent.DeletedAt.HasValue)
				return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.InvalidInput);

			if (existingEvent.Status == EventStatus.Cancelled)
				return ErrorResponse.FailureResult("Event cancelled cannot cancel", ErrorCodes.InvalidInput);

			var hasBookings = existingEvent.Bookings
				.Where(b => b.Status == BookingStatus.Completed)
				.ToList();

			if (existingEvent.Publish == true && hasBookings.Any())
				if (string.IsNullOrEmpty(request.ReasonCancel))
					return ErrorResponse.FailureResult("Cancellation of a published event with existing bookings must have a reason.", ErrorCodes.InvalidInput);

			var eventTitle = existingEvent.Title;
			var organizerUserId = existingEvent.OrganizerProfile?.UserId ?? Guid.Empty;
			var organizerUser = existingEvent.OrganizerProfile?.User;
			var firstImage = !string.IsNullOrEmpty(existingEvent.ImgListEvent)
				? existingEvent.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
				: null;

			if (existingEvent.OrganizerProfile == null)
				return ErrorResponse.FailureResult("Organizer profile not found", ErrorCodes.NotFound);

			return await _transactionHelper.ExecuteInTransactionAsync(async () =>
			{ 
				var organizerProfile = existingEvent.OrganizerProfile;
				if (organizerProfile != null)
				{
					organizerProfile.TotalEventFlags += 1;
					await _unitOfWork.OrganizerProfileRepository.UpdateAsync(organizerProfile);
				}

				if (hasBookings.Any() && !string.IsNullOrEmpty(request.ReasonCancel))
				{
					existingEvent.IsFlagWarning = true;
					existingEvent.Status = EventStatus.Cancelled;
					existingEvent.ReasonCancel = request.ReasonCancel.Trim();
					await _unitOfWork.EventRepository.UpdateAsync(existingEvent);
					await _hangfireJobService.EnqueueCancelEventJobAsync(eventId, request.ReasonCancel);
				}
				else
				{
					existingEvent.IsFlagWarning = true;
					existingEvent.Status = EventStatus.Cancelled;
					if (!string.IsNullOrEmpty(request.ReasonCancel))
					{
						existingEvent.ReasonCancel = request.ReasonCancel.Trim();
					}
					await _unitOfWork.EventRepository.UpdateAsync(existingEvent);
				}
 
				if (organizerUserId != Guid.Empty)
				{
					var notificationJobRequest = new CancelEventNotificationRequest
					{
						EventId = eventId,
						OrganizerUserId = organizerUserId,
						OrganizerProfileId = existingEvent.OrganizerProfileId,
						EventTitle = eventTitle,
						ReasonCancel = request.ReasonCancel,
						FirstImage = firstImage,
						OrganizerEmail = organizerUser?.Email,
						OrganizerFullName = organizerUser?.FullName,
						IsEmailNotificationEnabled = organizerUser?.IsEmailNotificationEnabled == true
					};

					await _hangfireJobService.EnqueueCancelEventNotificationJobAsync(notificationJobRequest);
				}

				return Result.Success();
			});
		}

		public async Task<Result> ResolveErrorPaymentAsync(Guid eventId)
		{
			if (eventId == Guid.Empty)
				return ErrorResponse.FailureResult("Invalid eventId", ErrorCodes.InvalidInput);

			var ev = await _unitOfWork.EventRepository
				.Query()
				.Include(e => e.OrganizerProfile)
				.FirstOrDefaultAsync(e => e.Id == eventId
                 && e.Status == EventStatus.ErrorPayment
                 && !e.IsDeleted && e.Publish == true);

			if (ev == null)
				return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            var systemSetting = await _unitOfWork.SystemSettingRepository
                .Query()
                .AsNoTracking()
                .Where(s => !s.IsDeleted && s.UpdatedAt <= ev.SaleStartTime) 
                .OrderByDescending(s => s.UpdatedAt)                     
                .FirstOrDefaultAsync();

            if (systemSetting == null)
            {
                systemSetting = await _unitOfWork.SystemSettingRepository
                    .Query()
                    .Where(s => !s.IsDeleted)
                    .OrderByDescending(s => s.UpdatedAt)
                    .FirstOrDefaultAsync();
            }

            if (systemSetting == null)
                return ErrorResponse.FailureResult("System setting not found", ErrorCodes.NotFound);

            if (ev.OrganizerProfile == null)
				return ErrorResponse.FailureResult("Organizer profile not found", ErrorCodes.NotFound);

			var paymentInfor = await _unitOfWork.PaymentInformationRepository
				.Query()
				.AsNoTracking()
				.FirstOrDefaultAsync(p => p.UserId == ev.OrganizerProfile.UserId && !p.IsDeleted);

			if (paymentInfor == null)
				return ErrorResponse.FailureResult("Payment information not found. Organizer needs to add payment information first.", ErrorCodes.NotFound);

			var existingRevenueReport = await _unitOfWork.RevenueReportRepository
				.Query()
				.FirstOrDefaultAsync(r => r.EventId == eventId && !r.IsDeleted);

			decimal platformFee = 0;
			decimal netRevenue = 0;

			if (ev.TotalAmount > 0)
			{
				platformFee = ev.TotalAmount * systemSetting.FlatformFee + systemSetting.FixFee;
				netRevenue = ev.TotalAmount - platformFee;
			}

			if (netRevenue < 0)
				return ErrorResponse.FailureResult("Payout amount is negative", ErrorCodes.InvalidInput);

			try
			{
				var referenceId = GenerateOrderCode().ToString();
				var payoutRequest = new PayoutRequest
				{
					ReferenceId = referenceId,
					Amount = (long)netRevenue,
					Description = "Thanh toán sự kiện - Xử lý lỗi thanh toán",
					ToBin = paymentInfor.BankBin,
					ToAccountNumber = paymentInfor.AccountNumber,
					Category = new List<string> { "Payout" }
				};

				var payoutResponse = await _payOSService.CreatePayoutAsync(payoutRequest);

				if (payoutResponse.ApprovalState != PayoutApprovalState.Completed)
                    return ErrorResponse.FailureResult($"Payout transaction failed. ApprovalState: {payoutResponse.ApprovalState}", ErrorCodes.InternalServerError);

                var payoutDate = DateTime.UtcNow;

				return await _transactionHelper.ExecuteInTransactionAsync(async () =>
				{
					ev.PlatformFee = platformFee;
					ev.PayoutAmount = netRevenue;
					ev.Status = EventStatus.PaidOut;
					ev.PaidOutAt = payoutDate;

					if (existingRevenueReport == null)
					{
						var revenueReport = new RevenueReport
						{
							OrganizerProfileId = ev.OrganizerProfileId,
							EventId = ev.Id,
							EventName = ev.Title,
							GrossRevenue = ev.TotalAmount,
							PlatformFee = platformFee,
							NetRevenue = netRevenue,
							ReportMonth = payoutDate.Month,
							ReportYear = payoutDate.Year,
							PayoutDate = payoutDate
						};

						await _unitOfWork.RevenueReportRepository.AddAsync(revenueReport);
					}
					else
					{
						existingRevenueReport.GrossRevenue = ev.TotalAmount;
						existingRevenueReport.PlatformFee = platformFee;
						existingRevenueReport.NetRevenue = netRevenue;
						existingRevenueReport.PayoutDate = payoutDate;
						existingRevenueReport.ReportMonth = payoutDate.Month;
						existingRevenueReport.ReportYear = payoutDate.Year;
						await _unitOfWork.RevenueReportRepository.UpdateAsync(existingRevenueReport);
					}

					await _unitOfWork.EventRepository.UpdateAsync(ev);
					await _unitOfWork.SaveChangesAsync();

					if (ev.OrganizerProfile != null)
					{
						await _notificationService.CreateNotificationAsync(new CreateNotificationRequest
						{
							UserId = ev.OrganizerProfile.UserId,
							Title = "Doanh thu đã được chuyển",
							Message = $"Sự kiện <strong>{ev.Title}</strong> đã được chuyển <strong>{netRevenue:N0} VND</strong> vào tài khoản. Lỗi thanh toán đã được xử lý.",
							Type = NotificationType.PayoutCompleted,
							EventId = ev.Id
						});
					}

					return Result.Success();
				});
			}
			catch (Exception ex)
			{
				return ErrorResponse.FailureResult($"Failed to process payout: {ex.Message}", ErrorCodes.InternalServerError);
			}
		}

		private static long GenerateOrderCode()
		{
			var random = new Random();
			var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
			var randomPart = random.Next(100, 999);
			return long.Parse($"{timestamp}{randomPart}");
		}
	}
}
