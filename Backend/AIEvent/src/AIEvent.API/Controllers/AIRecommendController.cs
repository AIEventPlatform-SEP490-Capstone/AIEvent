using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class AIRecommendController : ControllerBase
    {
        private readonly IEventEmbeddingService _eventEmbeddingService;
        private readonly IEventRecommendationService _eventRecommendationService;

        public AIRecommendController(IEventEmbeddingService eventEmbeddingService,
                                     IEventRecommendationService eventRecommendationService)
        {
            _eventEmbeddingService = eventEmbeddingService;
            _eventRecommendationService = eventRecommendationService;
        }

        [HttpPost("embed-events")]
        public async Task<IActionResult> EmbedEventsToPinecone()
        {
            await _eventEmbeddingService.EmbedAllEventsAsync();
            return Ok("Đã embed tất cả sự kiện vào Pinecone!");
        }

        [HttpPost()]
        public async Task<IActionResult> EmbedEventsToPinecone(PromptRequest request)
        {
            var response = await _eventRecommendationService.RecommendEventsAsync(request.UserPrompt);
            return Ok(response);
        }

        [HttpGet("event")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventsResponse>>>> GetEventAIRecommend([FromQuery] int pageNumber = 1,
                                                                                                            [FromQuery] int pageSize = 5)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventRecommendationService.GetEventAIRecommendAsync(pageNumber, pageSize, userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventsResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }
    }
}
