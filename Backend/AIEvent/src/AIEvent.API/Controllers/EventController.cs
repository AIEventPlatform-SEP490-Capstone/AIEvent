﻿using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.InviteFriend;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS.Models;

namespace AIEvent.API.Controllers
{
    [Route("api/event")]
    [ApiController]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IEventInvitationService _invitationService;
        public EventController(IEventService eventService, IEventInvitationService invitationService)
        {
            _eventService = eventService;
            _invitationService = invitationService;
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
        public async Task<ActionResult<SuccessResponse<object>>> CreateEvent([FromBody] CreateEventRequest request)
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
        public async Task<ActionResult<SuccessResponse<object>>> DeleteEvent(Guid id, [FromBody] string? reasonCancel)
        {
            var organizerId = User.GetRequiredOrganizerId();
            var result = await _eventService.DeleteEventAsync(id, organizerId, reasonCancel);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
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
                                                                                                          [FromQuery] EventStatus? status = null,
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
                SuccessCodes.Success,
                "Confirm event successfully"));
        }

        [HttpPost("{eventId}/invite-friends")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> InviteFriends(Guid eventId, [FromBody] InviteFriendRequest request)
        {
            var userId = User.GetRequiredUserId();

            var result = await _invitationService.InviteFriendsAsync(eventId, userId, request);

            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Invite friends successfully"));
        }

        [HttpPut("invitations/{invitationId}/confirm")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> ConfirmInvitation(Guid invitationId, [FromBody] ConfirmInvitationRequest request)
        {
            var userId = User.GetRequiredUserId();

            var result = await _invitationService.ConfirmInvitationAsync(invitationId, userId, request);

            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Confirm invite successfully"));
        }

        [HttpGet("invitations-status")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<BasePaginated<InviteFriendResponse>>>> GetSentInvitations([FromQuery] InvitationStatus? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _invitationService.GetInviteFriendsByStatusAsync(userId, status, page, pageSize);
            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<object>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Get invitations infor successfully"));
        }

        [HttpPost("report")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> ReportEvent([FromQuery] ReportEventRequest request)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventService.ReportEventAsyncs(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Report Event successfully"));
        }

        [HttpGet("{id}/report")]
        [Authorize(Roles = "Admin, Manager, Organizer")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ListReportResponse>>>> GetListReportEvent(string id,
                                                                                                          [FromQuery] EventReportType? type = null,
                                                                                                          [FromQuery] int pageNumber = 1,
                                                                                                          [FromQuery] int pageSize = 10)
        {
            var result = await _eventService.GetAllReportByEventId(pageNumber, pageSize, id, type);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ListReportResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "ReportEvent retrieved successfully"));
        }

        [HttpGet("report/{id}")]
        [Authorize(Roles = "Admin, Manager, Organizer")]
        public async Task<ActionResult<SuccessResponse<ReportResponse>>> GetEventReport(string id)
        {
            var result = await _eventService.GetEventReportDetailAsync(id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<ReportResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "ReportEvent retrieved successfully"));
        }

        [HttpPatch("report/{id}/reply")]
        [Authorize(Roles = "Admin, Manager, Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> ReplyReport(string id, [FromQuery] ReplyReportRequest request)
        {
            var result = await _eventService.ReplyReportAsync(id, request);

            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Reply successfully"));
        }

        [HttpGet("{id}/report/user")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<ReportResponse>>> GetEventReportOfUser(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _eventService.GetEventReportOfUserAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<ReportResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "ReportEvent retrieved successfully"));
        }

        [HttpGet("staff")]
        [Authorize(Roles = "Staff")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ListEventResponse>>>> GetListEventForStaff(
                                                                                                          [FromQuery] string? title,
                                                                                                          [FromQuery] string? categoryId,
                                                                                                          [FromQuery] int pageNumber = 1,
                                                                                                          [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _eventService.GetAllEventForStaff(userId, title, categoryId, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ListEventResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }

        [HttpGet("radius")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsLocationResponse>>>> GetListEventForStaff(
                                                                                                          [FromQuery] string? categoryId,
                                                                                                          [FromQuery] int? radius,
                                                                                                          [FromQuery] double latitude,
                                                                                                          [FromQuery] double longitude,
                                                                                                          [FromQuery] int pageNumber = 1,
                                                                                                          [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _eventService.GetAllEventByRadius(userId, radius, categoryId, latitude, longitude, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsLocationResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }
    }
}
