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
            var result = await _eventService.GetEventAsync(search, eventCategoryId, tags, ticketType, city, timeLine, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
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
