using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Notification;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpPost("admin/create")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateCustomNotification([FromBody] CreateNotificationToAllRequest request)
        {
            var result = await _notificationService.CreateNotificationToAllAsync(request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Notification sent successfully"));
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<NotificationResponse>>>> GetNotifications(
            [FromQuery] bool? isRead,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _notificationService.GetNotificationsByUserIdAsync(userId, isRead, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<NotificationResponse>>.SuccessResult(
                result.Value!,
                message: "Get list of successful notifications"));
        }

        [HttpPatch("{notificationId}/read")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> MarkAsRead(Guid notificationId)
        {
            var result = await _notificationService.MarkAsReadAsync(notificationId);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Marked notification as read"));
        }

        [HttpPatch("read-all")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> MarkAllAsRead()
        {
            var userId = User.GetRequiredUserId();
            var result = await _notificationService.MarkAllAsReadAsync(userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Marked all notifications as read"));
        }

        [HttpDelete("read")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteReadNotifications()
        {
            var userId = User.GetRequiredUserId();
            var result = await _notificationService.DeleteIsReadNotificationsAsync(userId);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "Cleared all read receipts"));
        }
    }
}
