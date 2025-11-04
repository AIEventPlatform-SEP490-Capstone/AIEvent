﻿using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Organizer;
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
        public async Task<ActionResult<SuccessResponse<EventDetailResponse>>> GetEventById(Guid id)
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
                                                                                                 [FromQuery] TicketPricingType? ticketType, 
                                                                                                 [FromQuery] string? district, 
                                                                                                 [FromQuery] TimeLine? timeLine,
                                                                                                 [FromQuery] int pageNumber = 1,
                                                                                                 [FromQuery] int pageSize = 5)
        {

            Guid? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = User.GetRequiredUserId();
            }

            var result = await _eventService.GetEventAsync(userId, search, eventCategoryId, tags, ticketType, district, timeLine, pageNumber, pageSize);
            
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

        [HttpPatch("{id}")]
        [Authorize(Roles = "Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateEvent(Guid id, [FromForm] UpdateEventRequest request)
        {
            Guid organizerId = User.GetRequiredOrganizerId();

            var result = await _eventService.UpdateEventAsync(organizerId, id, request);

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
            Guid organizerId = User.GetRequiredOrganizerId();
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

        [HttpDelete("{id}")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteEvent(Guid id, [FromQuery] string? reasonCancel)
        {
            var organizerId = User.GetRequiredOrganizerId();
            var result = await _eventService.DeleteEventAsync(id, organizerId, reasonCancel);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Delete Event successfully"));
        }

        [HttpGet("draft")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsRawResponse>>>> GetEventsDraft([FromQuery] int pageNumber = 1,
                                                                                                        [FromQuery] int pageSize = 10)
        {
            var organizerId = User.GetRequiredOrganizerId();
            var result = await _eventService.GetAllEventDraftAsync(organizerId, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsRawResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event raw retrieved successfully"));
        }


        [HttpGet("status")]
        [Authorize(Roles = "Admin, Manager, Organizer")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsRawResponse>>>> GetEventStatus([FromQuery] string? search,
                                                                                                          [FromQuery] ConfirmEventStatus? status = null,
                                                                                                          [FromQuery] int pageNumber = 1,
                                                                                                          [FromQuery] int pageSize = 10)
        {
            Guid organizerId = Guid.Empty;
            if (User.IsInRole("Organizer"))
            {
                organizerId = User.GetRequiredOrganizerId();
            }
            var result = await _eventService.GetAllEventStatusAsync(organizerId, search, status, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsRawResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }


        [HttpPatch("confirm/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> ConfirmEvent(Guid id, [FromForm] ConfirmEventRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _eventService.ConfirmEventAsync(userId, id, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Confirm event successfully"));
        }

        [HttpPost("request-end")]
        [Authorize(Roles = "Admin,Manager,Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> RequestEndEvent(CompleteEventRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _eventService.RequestEndEventAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Request end event successfully"));
        }

        [HttpPatch("end-event/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> ConfirmEndEvent(ApproveEndEventRequest request)
        {
            var result = await _eventService.ConfirmEndEventAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "End event successfully"));
        }

        [HttpGet("request-end/{endEventRequestId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<EndEventReview>>> GetEndEventRequestById(Guid endEventRequestId)
        {
            var result = await _eventService.GetEndEventRequestByIdAsync(endEventRequestId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<EndEventReview>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Get end event request successfully"));
        }

        [HttpGet("request-end")]
        [Authorize(Roles = "Admin,Manager,Organizer")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EndEventReviews>>>> GetEndEventRequest([FromQuery] ConfirmEventStatus? status = null,
                                                                                                            [FromQuery] int pageNumber = 1,
                                                                                                            [FromQuery] int pageSize = 10)
        {
            Guid organizerId = Guid.Empty;
            if (User.IsInRole("Organizer"))
            {
                organizerId = User.GetRequiredOrganizerId();
            }
            var result = await _eventService.GetEndEventRequestsAsync(organizerId, status, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EndEventReviews>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Get list end event request successfully"));
        }
    }
}
