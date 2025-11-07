using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Rating;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/rating")]
    [ApiController]
    public class RatingController : ControllerBase
    {
        private readonly IRatingService _ratingService;
        public RatingController(IRatingService ratingService)
        {
            _ratingService = ratingService;
        }

        [HttpGet("{id}/event")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<BasePaginated<RatingResponse>>>> GetRatingByEventId(Guid id,
                                                                                                           [FromQuery] int pageNumber = 1,
                                                                                                           [FromQuery] int pageSize = 5)
        {
            Guid? userId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = User.GetRequiredUserId();
            }
            var result = await _ratingService.GetRatingByEventId(userId, id, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<RatingResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Rating by event retrieved successfully"));
        }

        [HttpPatch("{id}")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateRating(Guid id, [FromBody] RatingRequest request)
        {
            Guid userId = User.GetRequiredUserId();

            var result = await _ratingService.UpdateRatingAsync(userId, id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Rating updated successfully"));
        }

        [HttpPost("{id}/event")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> CreateRating(Guid id, [FromBody] RatingRequest request)
        {
            Guid userId = User.GetRequiredUserId();

            var result = await _ratingService.CreateRatingAsync(userId, id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create rating updated successfully"));
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteRating(Guid id)
        {
            Guid userId = User.GetRequiredUserId();

            var result = await _ratingService.DeleteRatingAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "Delete rating updated successfully"));
        }
    }
}
