using AIEvent.Application.DTOs.AIRecommendation;
using AIEvent.Application.Services.Interfaces;
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
    }
}
