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
        public EventService(IUnitOfWork unitOfWork, ITransactionHelper transactionHelper, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _transactionHelper = transactionHelper;
            _mapper = mapper;
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
            }

            var organizer = await _unitOfWork.OrganizerProfileRepository.GetByIdAsync(organizerId, true);
            if (organizer?.Status != ConfirmOrganizerProfileStatus.Approve)
                return ErrorResponse.FailureResult("Organizer not found or inactive", ErrorCodes.Unauthorized);

            var events = _mapper.Map<Event>(request);
            if (events == null)
                return ErrorResponse.FailureResult("Failed to map event", ErrorCodes.InternalServerError);
            
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
                                                                                TicketPricingType? ticketType, 
                                                                                string? district, 
                                                                                TimeLine? timeLine, 
                                                                                int pageNumber = 1, 
                                                                                int pageSize = 5)
        {
            IQueryable<Event> events = _unitOfWork.EventRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => e.StartTime > DateTime.Now && !e.DeletedAt.HasValue && e.RequireApproval == ConfirmEventStatus.Approve);

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
                    TicketPricingType = e.TicketPricingType,
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
                {
                    eventQuery.Publish = true;
                    eventQuery.RequireApproval = ConfirmEventStatus.NeedConfirm;
                }
                
                await _unitOfWork.EventRepository.UpdateAsync(eventQuery);

                return Result.Success();
            });
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
                .Include(e => e.OrganizerProfile)
                .Include(e => e.Bookings)
                    .ThenInclude(b => b.User)
                    .ThenInclude(u => u.Wallet)
                .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

            if (existingEvent == null || existingEvent.DeletedAt.HasValue)
                return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.InvalidInput);

            if(existingEvent.OrganizerProfileId != organizerId)
                return ErrorResponse.FailureResult("Cannot delete other people's events", ErrorCodes.Unauthorized);

            var hasBookings = existingEvent.Bookings
                .Where(b => b.Status == BookingStatus.Completed || b.Status == BookingStatus.Pending)
                .ToList();

            if (existingEvent.Publish == true && hasBookings.Any())
                if (string.IsNullOrEmpty(reasonCancel))
                    return ErrorResponse.FailureResult("Cancellation of a published event with existing bookings must have a reason.", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            { 
                if (hasBookings.Any() && !string.IsNullOrEmpty(reasonCancel))
                { 
                    var organizerWallet = await _unitOfWork.WalletRepository
                        .Query()
                        .FirstOrDefaultAsync(w => w.UserId == existingEvent.OrganizerProfile!.UserId && !w.IsDeleted);

                    if (organizerWallet == null)
                        return ErrorResponse.FailureResult("Organizer wallet not found", ErrorCodes.NotFound);

                    var walletTransactions = new List<WalletTransaction>();
                    var bookingsToUpdate = new List<Booking>();
                    var walletsToUpdate = new List<Wallet>();

                    foreach (var booking in hasBookings)
                    { 
                        if (booking.TotalAmount <= 0)
                        {
                            booking.Status = BookingStatus.Cancelled;
                            bookingsToUpdate.Add(booking);
                            continue;
                        }

                        var userWallet = booking.User.Wallet;
                        if (userWallet == null)
                            return ErrorResponse.FailureResult($"Wallet not found for user {booking.User.FullName}", ErrorCodes.NotFound);

                        if (organizerWallet.Balance < booking.TotalAmount)
                            return ErrorResponse.FailureResult(
                                    $"Organizer wallet has insufficient balance to refund. Required: {booking.TotalAmount}, Available: {organizerWallet.Balance}",
                                    ErrorCodes.InvalidInput);

                        var userRefundTransaction = new WalletTransaction
                        {
                            WalletId = userWallet.Id,
                            Amount = booking.TotalAmount,
                            BalanceBefore = userWallet.Balance,
                            BalanceAfter = userWallet.Balance + booking.TotalAmount,
                            Type = TransactionType.Refund,
                            Direction = TransactionDirection.In,
                            ReferenceId = booking.Id,
                            ReferenceType = ReferenceType.Refund,
                            Status = TransactionStatus.Success,
                            Description = $"Hoàn tiền do hủy sự kiện '{existingEvent.Title}'. Lý do: {reasonCancel}"
                        };
                         
                        var organizerRefundTransaction = new WalletTransaction
                        {
                            WalletId = organizerWallet.Id,
                            Amount = booking.TotalAmount,
                            BalanceBefore = organizerWallet.Balance,
                            BalanceAfter = organizerWallet.Balance - booking.TotalAmount,
                            Type = TransactionType.Refund,
                            Direction = TransactionDirection.Out,
                            ReferenceId = booking.Id,
                            ReferenceType = ReferenceType.Refund,
                            Status = TransactionStatus.Success,
                            Description = $"Hoàn tiền cho {booking.User.FullName} do hủy sự kiện '{existingEvent.Title}'. Lý do: {reasonCancel}"
                        };

                        walletTransactions.Add(userRefundTransaction);
                        walletTransactions.Add(organizerRefundTransaction);
                         
                        userWallet.Balance += booking.TotalAmount;
                        organizerWallet.Balance -= booking.TotalAmount;
                         
                        if (!walletsToUpdate.Any(w => w.Id == userWallet.Id))
                            walletsToUpdate.Add(userWallet);
                         
                        booking.Status = BookingStatus.Cancelled;
                        bookingsToUpdate.Add(booking);
                    }
                     
                    if (!walletsToUpdate.Any(w => w.Id == organizerWallet.Id))
                        walletsToUpdate.Add(organizerWallet);
                     
                    await _unitOfWork.WalletTransactionRepository.AddRangeAsync(walletTransactions);
                     
                    await _unitOfWork.WalletRepository.UpdateRangeAsync(walletsToUpdate);
                     
                    await _unitOfWork.BookingRepository.UpdateRangeAsync(bookingsToUpdate);
                     
                    existingEvent.ReasonCancel = reasonCancel;
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
                                                .Where(e => e.StartTime > DateTime.Now 
                                                        && !e.DeletedAt.HasValue 
                                                        && e.RequireApproval == ConfirmEventStatus.Approve
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
                    Status = e.RequireApproval,
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

        public async Task<Result<BasePaginated<EventsRawResponse>>> GetAllEventStatusAsync(Guid? organizerId, string? search, ConfirmEventStatus? status = null, int pageNumber = 1, int pageSize = 10)
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
                events = events.Where(e => e.RequireApproval == status);

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
                    Status = e.RequireApproval,
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
                .FirstOrDefaultAsync(e => e.Id == eventId && !e.IsDeleted);

            if(entity == null)
                return ErrorResponse.FailureResult("Event can not found or is deleted", ErrorCodes.NotFound);

            if (entity.RequireApproval != ConfirmEventStatus.NeedConfirm)
                return ErrorResponse.FailureResult("Event has already been processed", ErrorCodes.InvalidInput);

            if (request.Status == ConfirmEventStatus.Reject)
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

        public async Task<Result> RequestEndEventAsync(Guid userId, CompleteEventRequest request)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid userId", ErrorCodes.InvalidInput);

            var validation = ValidationHelper.ValidateModel(request);
            if (!validation.IsSuccess)
                return validation;

            var eventEntity = await _unitOfWork.EventRepository.Query()
                .Include(e => e.OrganizerProfile)
                .FirstOrDefaultAsync(e => e.Id == request.EventId && !e.IsDeleted);

            if (eventEntity == null)
                return ErrorResponse.FailureResult("Event not found", ErrorCodes.NotFound);

            if (eventEntity.OrganizerProfile == null || eventEntity.OrganizerProfile.UserId != userId)
                return ErrorResponse.FailureResult("You can only request to end your own events", ErrorCodes.Unauthorized);

            if (eventEntity.EndTime > DateTime.UtcNow)
                return ErrorResponse.FailureResult("Event is not over yet", ErrorCodes.InvalidInput);

            var existingPendingRequest = await _unitOfWork.EndEventRequestRepository
                .Query()
                .FirstOrDefaultAsync(x => x.EventId == eventEntity.Id 
                    && x.Status == ConfirmEventStatus.PendingApproval 
                    && x.IsLatest 
                    && !x.IsDeleted);

            if (existingPendingRequest != null)
                return ErrorResponse.FailureResult("There is already a pending end event request for this event", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var oldRequests = await _unitOfWork.EndEventRequestRepository
                                            .Query()
                                            .Where(x => x.EventId == eventEntity.Id && x.IsLatest && !x.IsDeleted)
                                            .ToListAsync();

                foreach (var old in oldRequests)
                    old.IsLatest = false;

                eventEntity.RequireApproval = ConfirmEventStatus.PendingApproval;

                var endEventRequest = _mapper.Map<EndEventRequest>(request);
                endEventRequest.IsLatest = true;
                endEventRequest.Status = ConfirmEventStatus.PendingApproval;
                endEventRequest.OrganizerProfileId = eventEntity.OrganizerProfileId;

                await _unitOfWork.EventRepository.UpdateAsync(eventEntity);
                await _unitOfWork.EndEventRequestRepository.AddAsync(endEventRequest);
                
                return Result.Success();
            });
        }

        public async Task<Result> ConfirmEndEventAsync(ApproveEndEventRequest request)
        {
            var validation = ValidationHelper.ValidateModel(request);
            if (!validation.IsSuccess)
                return validation;

            var endEventRequest = await _unitOfWork.EndEventRequestRepository.Query()
                .FirstOrDefaultAsync(e => e.Id == request.EndEventRequestId 
                    && e.Status == ConfirmEventStatus.PendingApproval 
                    && e.IsLatest 
                    && !e.IsDeleted);

            if (endEventRequest == null)
                return ErrorResponse.FailureResult("EndEventRequest not found or already processed", ErrorCodes.InvalidInput);

            var eventEntity = await _unitOfWork.EventRepository.Query()
                .FirstOrDefaultAsync(e => e.Id == endEventRequest.EventId 
                    && !e.IsDeleted 
                    && e.RequireApproval == ConfirmEventStatus.PendingApproval);

            if (eventEntity == null)
                return ErrorResponse.FailureResult("Event not found or already processed", ErrorCodes.NotFound);

            if (eventEntity.EndTime > DateTime.UtcNow)
                return ErrorResponse.FailureResult("Event is not over yet", ErrorCodes.InvalidInput);

            if (eventEntity.Publish != true)
                return ErrorResponse.FailureResult("Can only confirm end event request for published events", ErrorCodes.InvalidInput);

            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                if(request.Status == ConfirmEventStatus.Approve)
                {
                    var totalRevenue = eventEntity.TotalAmount;

                    var platformFee = totalRevenue * 0.066m + 45000m;
                    var netRevenue = totalRevenue - platformFee;

                    eventEntity.PlatformFee = platformFee;
                    eventEntity.PayoutAmount = netRevenue;
                    endEventRequest.Status = ConfirmEventStatus.WaitingForPayout;
                    endEventRequest.ReviewedAt = DateTime.UtcNow;

                    eventEntity.RequireApproval = ConfirmEventStatus.WaitingForPayout;
                }
                else
                {
                    if(string.IsNullOrWhiteSpace(request.AdminNote))
                        return ErrorResponse.FailureResult("Admin note is required when rejecting request", ErrorCodes.InvalidInput);
                    endEventRequest.AdminNote = request.AdminNote.Trim();
                    endEventRequest.Status = ConfirmEventStatus.NeedMoreEvidence;
                    endEventRequest.ReviewedAt = DateTime.UtcNow;
                    eventEntity.RequireApproval = ConfirmEventStatus.NeedMoreEvidence;
                }

                await _unitOfWork.EndEventRequestRepository.UpdateAsync(endEventRequest);
                await _unitOfWork.EventRepository.UpdateAsync(eventEntity);
                return Result.Success();
            });
        }

        public async Task<Result<EndEventReview>> GetEndEventRequestByIdAsync(Guid endEventRequestId)
        {
            if (endEventRequestId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid EndEventRequestId", ErrorCodes.InvalidInput);

            var endEventRequest = await _unitOfWork.EndEventRequestRepository
                .Query()
                .Where(e => e.Id == endEventRequestId && !e.IsDeleted)
                .ProjectTo<EndEventReview>(_mapper.ConfigurationProvider)
                .FirstOrDefaultAsync();

            if (endEventRequest == null)
                return ErrorResponse.FailureResult("End event request not found", ErrorCodes.NotFound);

            return Result<EndEventReview>.Success(endEventRequest);
        }

        public async Task<Result<BasePaginated<EndEventReviews>>> GetEndEventRequestsAsync(Guid? organizerId, ConfirmEventStatus? status = null, int pageNumber = 1, int pageSize = 10)
        {
            IQueryable<EndEventRequest> endEventRequest = _unitOfWork.EndEventRequestRepository
                                                .Query()
                                                .AsNoTracking()
                                                .Where(e => !e.IsDeleted);

            if (organizerId.HasValue && organizerId != Guid.Empty)
                endEventRequest = endEventRequest.Where(e => e.OrganizerProfileId == organizerId);

            if (status != null)
                endEventRequest = endEventRequest.Where(e => e.Status == status);

            int totalCount = await endEventRequest.CountAsync();

            var result = await endEventRequest
                .OrderBy(p => p.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new EndEventReviews
                {
                    OrganizerName = e.OrganizerProfile.ContactName ?? e.OrganizerProfile.ContactEmail,
                    EventTitle = e.Event.Title,
                    EventId = e.EventId,
                    EndEventRequestId = e.Id,
                    CreatedAt = e.CreatedAt,
                    EndTime = e.Event.EndTime,
                    StartTime = e.Event.StartTime,
                    PayoutAmount = e.Event.PayoutAmount,
                    PlatformFee = e.Event.PlatformFee,
                    ReviewedAt = e.ReviewedAt,
                    Status = e.Status,
                    TotalAmount = e.Event.TotalAmount,
                    AdminNote = e.AdminNote,
                    Summary = e.Summary,
                    EvidenceImages = string.IsNullOrEmpty(e.EvidenceImages)
                        ? new List<string>()
                        : e.EvidenceImages.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                })
                .ToListAsync();

            return new BasePaginated<EndEventReviews>(result, totalCount, pageNumber, pageSize);
        }

    }
}
