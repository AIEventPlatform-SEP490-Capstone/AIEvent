using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Friend;
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

        [HttpPost("chat")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> ChatRecommendEvents(PromptRequest request)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventRecommendationService.RecommendEventsAsync(request.UserPrompt, userId, request.SessionId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }
            return Ok(SuccessResponse<object>.SuccessResult(
               result.Value!,
               SuccessCodes.Success,
               "Event retrieved successfully"));
        }

        [HttpGet("event")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<AiRecommendEventResponse>>>> GetEventAIRecommend([FromQuery] int pageNumber = 1,
                                                                                                            [FromQuery] int pageSize = 5)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventRecommendationService.GetEventAIRecommendAsync(pageNumber, pageSize, userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<AiRecommendEventResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event retrieved successfully"));
        }

        [HttpGet("chat/history")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ChatLogResponse>>>> GetChatHistory(
            [FromQuery] Guid? sessionId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventRecommendationService.GetChatHistoryAsync(userId, sessionId, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ChatLogResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Chat history retrieved successfully"));
        }

        [HttpGet("chat/sessions")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<SessionResponse>>>> GetSessions(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventRecommendationService.GetSessionsAsync(userId, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<SessionResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Sessions retrieved successfully"));
        }

        [HttpDelete("chat/sessions/{sessionId}")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteSession(Guid sessionId)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventRecommendationService.DeleteSessionAsync(userId, sessionId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Session deleted successfully"));
        }

        [HttpGet("friend")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ListSearchFriend>>>> GetFriendAIRecommend([FromQuery] int pageNumber = 1,[FromQuery] int pageSize = 5)
        {
            Guid userId = User.GetRequiredUserId();
            var result = await _eventRecommendationService.GetFriendAIRecommendAsync(pageNumber, pageSize, userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ListSearchFriend>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Friend retrieved successfully"));
        }
    }
}
