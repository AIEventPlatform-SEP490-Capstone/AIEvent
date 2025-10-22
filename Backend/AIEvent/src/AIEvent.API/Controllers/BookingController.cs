using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Booking;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;
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

        [HttpGet("ticket")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<TicketResponse>>>> GetListTicket(string? title, DateTime? startTime,
                                                                                            DateTime? endTime, TicketStatus? status,
                                                                                            [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _bookingService.GetListTicketAsync(pageNumber, pageSize, userId, title, startTime, endTime, status);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<TicketResponse>>.SuccessResult(
                result.Value!,
                message: "Ticket retrieved successfully"));
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

    }
}
