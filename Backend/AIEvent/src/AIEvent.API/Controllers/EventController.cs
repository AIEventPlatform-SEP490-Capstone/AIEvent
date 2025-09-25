using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Services.Interfaces;
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
        [Authorize]
        public async Task<ActionResult<SuccessResponse<EventResponse>>> GetOrganizerById(string id)
        {
            var result = await _eventService.GetEventById(id);
            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<EventResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }

        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateEvent([FromForm] CreateEventRequest request)
        {
            var organizerId = User.GetRequiredOrganizerId();
            var result = await _eventService.CreateEvent(organizerId, request);
            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Register Event successfully"));
        }
    }
}
