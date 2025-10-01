using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
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
        public async Task<Result> CreateEvent(Guid organizerId, CreateEventRequest request)
        {
            return await _transactionHelper.ExecuteInTransactionAsync(async () =>
            {
                var organizer = await _unitOfWork.OrganizerProfileRepository.GetByIdAsync(organizerId);
                if (organizer?.IsApprove != true)
                {
                    return ErrorResponse.FailureResult("Event not found or inactive", ErrorCodes.Unauthorized);
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

                return Result.Success();
            });
        }

        public async Task<Result<EventDetailResponse>> GetEventById(string eventId)
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
    }
}
