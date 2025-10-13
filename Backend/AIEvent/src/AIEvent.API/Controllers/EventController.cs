using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/event")]
    [ApiController]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        public EventController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<EventDetailResponse>>> GetEventById(string id)
        {
            var result = await _eventService.GetEventByIdAsync(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<EventDetailResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsResponse>>>> GetEvent([FromQuery]string? search,
                                                                                                 [FromQuery] string? eventCategoryId,
                                                                                                 [FromQuery] List<EventTagRequest> tags,
                                                                                                 [FromQuery] TicketType? ticketType, 
                                                                                                 [FromQuery] string? city, 
                                                                                                 [FromQuery] TimeLine? timeLine,
                                                                                                 [FromQuery] int pageNumber = 1,
                                                                                                 [FromQuery] int pageSize = 5)
        {

            Guid? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = User.GetRequiredUserId();
            }

            var result = await _eventService.GetEventAsync(userId, search, eventCategoryId, tags, ticketType, city, timeLine, pageNumber, pageSize);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }

        [HttpGet("{id}/related")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsRelatedResponse>>>> GetRelatedEvent(Guid id, 
                                                                                                               [FromQuery] int pageNumber = 1,
                                                                                                               [FromQuery] int pageSize = 5)
        {
            var result = await _eventService.GetRelatedEventAsync(id, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsRelatedResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event related retrieved successfully"));
        }

        [HttpGet("organizer")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsResponse>>>> GetEventOrganizer([FromQuery] string? search,
                                                                                                          [FromQuery] string? eventCategoryId,
                                                                                                          [FromQuery] List<EventTagRequest> tags,
                                                                                                          [FromQuery] TicketType? ticketType,
                                                                                                          [FromQuery] string? city,
                                                                                                          [FromQuery] bool? IsSortByNewest,
                                                                                                          [FromQuery] int pageNumber = 1,
                                                                                                          [FromQuery] int pageSize = 5)
        {

            Guid userId = User.GetRequiredUserId();
            Guid organizer = User.GetRequiredOrganizerId();

            var result = await _eventService.GetEventByOrganizerAsync(userId, organizer, search, eventCategoryId, tags, ticketType, city, IsSortByNewest, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event by Organizer retrieved successfully"));
        }

        [HttpPut("{id}")]
        [Authorize("Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateEvent(Guid id, [FromForm] UpdateEventRequest request)
        {
            Guid userId = User.GetRequiredUserId();
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _eventService.UpdateEventAsync(organizerId, userId, id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Event updated successfully"));
        }

        [HttpPost]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateEvent([FromForm] CreateEventRequest request)
        {
            var organizerId = User.GetRequiredOrganizerId();
            var result = await _eventService.CreateEventAsync(organizerId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Register Event successfully"));
        }

        [HttpDelete]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteEvent(string eventId)
        {
            var result = await _eventService.DeleteEventAsync(eventId);
            if (    !result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Delete Event successfully"));
        }
    }
}
