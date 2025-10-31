using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [ApiController]
    [Route("api/booking")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateBooking([FromBody] CreateBookingRequest request)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _bookingService.CreateBookingAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create Booking successfully"));
        }

        [HttpGet("ticket/qr/{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<QrResponse>>> GetQrCode(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _bookingService.GetQrCodeAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<QrResponse>.SuccessResult(
                result.Value!,
                message: "QrCode retrieved successfully"));
        }

        [HttpPatch("ticket/refund/{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> RefundTicket(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _bookingService.RefundTicketAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Refund ticket successfully"));
        }

        [HttpGet("event")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ListEventOfUser>>>> GetListEventOfUser(string? title, DateTime? startTime,DateTime? endTime,
                                                                                            [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _bookingService.GetListEventOfUser(pageNumber, pageSize, userId, title, startTime, endTime);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ListEventOfUser>>.SuccessResult(
                result.Value!,
                message: "Event retrieved successfully"));
        }

        [HttpGet("event/{id}/ticket")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<TicketByEventResponse>>>> GetListEventOfUser(
           string id, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _bookingService.GetTicketsByEventAsync(userId, id, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<TicketByEventResponse>>.SuccessResult(
                result.Value!,
                message: "Ticket retrieved successfully"));
        }

        [HttpPatch("check-in")]
        [Authorize(Roles = "Admin,Manager,Organizer,Staff")]
        public async Task<ActionResult<SuccessResponse<CheckInResponse>>> CheckIn(CheckInRequest request)
        {
            var result = await _bookingService.CheckInTicketAsync(request.QrContent);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<CheckInResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Check-in successfully"));
        }
    }
}
