using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/favorite-event")]
    [ApiController]
    public class FavoriteEventController : ControllerBase
    {
        private readonly IFavoriteEventService _favoriteEventService;
        public FavoriteEventController(IFavoriteEventService favoriteEventService)
        {
            _favoriteEventService = favoriteEventService;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsResponse>>>> GetEvent([FromQuery] string? search,
                                                                                                 [FromQuery] string? eventCategoryId,
                                                                                                 [FromQuery] int pageNumber = 1,
                                                                                                 [FromQuery] int pageSize = 5)
        {
            Guid userId = User.GetRequiredUserId();

            var result = await _favoriteEventService.GetFavoriteEvent(userId, search, eventCategoryId, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Favorite Event retrieved successfully"));
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> AddFavoriteEvent(Guid eventId)
        {
            var userId = User.GetRequiredUserId();
            var result = await _favoriteEventService.AddFavoriteEvent(userId, eventId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Add Favorite Event successfully"));
        }

        [HttpDelete]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteFavoriteEvent(Guid eventId)
        {
            var userId = User.GetRequiredUserId();
            var result = await _favoriteEventService.RemoveFavoriteEvent(userId, eventId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Remove Favorite Event successfully"));
        }

    }
}
